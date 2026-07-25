"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { CartLines } from "@/components/public/cart-lines";
import { CartSummary } from "@/components/public/cart-summary";
import { CopperRule } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { countItems, useCartStore } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";

/**
 * O ícone é uma adição ao DESIGN.md, que não define sistema de ícones: Lucide
 * com traço 1.5, como lá está previsto para os casos inevitáveis.
 */
export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { lines } = useCart();
  const clear = useCartStore((s) => s.clear);
  const count = countItems(lines);
  const label = count > 0 ? `Cesta, ${count} ${count === 1 ? "item" : "itens"}` : "Cesta, vazia";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={label}
        className="relative inline-flex items-center gap-2 p-2 text-body hover:text-copper-300"
      >
        <ShoppingBasket aria-hidden="true" strokeWidth={1.5} className="size-5" />
        <span className="hidden font-accent text-eyebrow tracking-caps uppercase sm:inline">
          Cesta
        </span>
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 inline-flex size-4 items-center justify-center rounded-full bg-brand font-accent text-[10px] leading-none text-char-900"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-h3 tracking-caps text-display">
            A tua cesta
          </SheetTitle>
        </SheetHeader>
        <CopperRule className="mx-4" />

        <div className="flex-1 overflow-y-auto px-4">
          {lines.length > 0 ? (
            <CartLines lines={lines} compact />
          ) : (
            <p className="py-10 text-center text-small text-subtle">
              A cesta está vazia. Percorre o catálogo e adiciona peças.
            </p>
          )}
        </div>

        {lines.length > 0 ? (
          <SheetFooter className="gap-4">
            <CartSummary lines={lines} />
            <div className="flex flex-col gap-2">
              <Button asChild size="lg" onClick={() => setOpen(false)}>
                <Link href="/cesta">Ver a cesta</Link>
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                Limpar a cesta
              </Button>
            </div>
          </SheetFooter>
        ) : (
          <SheetFooter>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/produtos">Ver o catálogo</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
