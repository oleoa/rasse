"use client";

import { useState } from "react";
import Link from "next/link";
import { CartCheckout } from "@/components/public/cart-checkout";
import { CartConfirmation, type SentCart } from "@/components/public/cart-confirmation";
import { CartLines } from "@/components/public/cart-lines";
import { CartSummary } from "@/components/public/cart-summary";
import { EmptyState } from "@/components/public/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";

export function CartPageClient() {
  const { lines, hydrated } = useCart();
  const [sent, setSent] = useState<SentCart | null>(null);
  const clear = useCartStore((s) => s.clear);

  // Precisa vir antes de tudo: o envio limpa a cesta, e o código não pode
  // desaparecer com ela.
  if (sent) return <CartConfirmation {...sent} />;

  if (!hydrated) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title="A cesta está vazia."
        description="Percorra o catálogo e adicione as peças que quiser."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/produtos">Ver o catálogo</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/personalizado">Pedir sob medida</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <CartLines lines={lines} />
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Limpar a cesta
          </Button>
        </div>
      </div>

      <aside className="flex h-fit flex-col gap-6 rounded-md border border-border p-6">
        <CartSummary lines={lines} />
        <CartCheckout lines={lines} onSent={setSent} />
      </aside>
    </div>
  );
}
