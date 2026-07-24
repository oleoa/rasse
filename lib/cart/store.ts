"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * A cesta vive só no browser até ao clique de envio. Não há carrinhos
 * abandonados na base de dados — ver CLAUDE.md, secção 6.
 *
 * O snapshot de nome e preço serve apenas para renderizar a cesta sem ir à rede.
 * O servidor nunca confia nele: a Server Action recarrega tudo por id.
 */

export type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  personalizationText: string | null;
  productName: string;
  productSlug: string;
  variantName: string | null;
  /** null quando o produto é `on_request`. */
  unitPriceCents: number | null;
  imageKey: string | null;
};

export type NewCartLine = Omit<CartLine, "key">;

export const MAX_QUANTITY = 99;
export const MAX_LINES = 50;

/** Produto + variante + texto de personalização. Ver PLAN.md, fase 4. */
export function lineKey(
  productId: string,
  variantId: string | null,
  personalizationText: string | null,
): string {
  return [productId, variantId ?? "", personalizationText?.trim() ?? ""].join("|");
}

type CartState = {
  lines: CartLine[];
  addLine: (line: NewCartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      addLine: (line) =>
        set((state) => {
          const key = lineKey(line.productId, line.variantId, line.personalizationText);
          const existing = state.lines.find((l) => l.key === key);

          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key
                  ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + line.quantity) }
                  : l,
              ),
            };
          }

          if (state.lines.length >= MAX_LINES) return state;

          return {
            lines: [
              ...state.lines,
              { ...line, key, quantity: Math.min(MAX_QUANTITY, line.quantity) },
            ],
          };
        }),

      setQuantity: (key, quantity) =>
        set((state) => {
          if (quantity < 1) return { lines: state.lines.filter((l) => l.key !== key) };
          return {
            lines: state.lines.map((l) =>
              l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l,
            ),
          };
        }),

      removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: "rasse-cesta",
      version: 1,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export function countItems(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/** Só os itens de preço fixo entram no subtotal. */
export function subtotalCents(lines: CartLine[]): number {
  return lines.reduce(
    (total, line) =>
      line.unitPriceCents === null ? total : total + line.unitPriceCents * line.quantity,
    0,
  );
}

export function hasOnRequest(lines: CartLine[]): boolean {
  return lines.some((line) => line.unitPriceCents === null);
}
