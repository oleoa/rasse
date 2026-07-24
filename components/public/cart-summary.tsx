"use client";

import { formatBRL } from "@/lib/format";
import { hasOnRequest, subtotalCents, type CartLine } from "@/lib/cart/store";

export function CartSummary({ lines }: { lines: CartLine[] }) {
  const subtotal = subtotalCents(lines);
  const parcial = hasOnRequest(lines);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-accent text-eyebrow tracking-caps text-subtle uppercase">
          {parcial ? "Subtotal parcial" : "Subtotal"}
        </span>
        <span className="font-accent text-h3 tracking-caps text-display">
          {formatBRL(subtotal)}
        </span>
      </div>
      {parcial ? (
        <p className="text-small text-subtle">
          Há peças sob consulta que não entram neste valor. O preço delas é combinado na conversa.
        </p>
      ) : null}
    </div>
  );
}
