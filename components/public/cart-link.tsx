import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O contador chega por prop nesta fase. A Fase 4 liga-o à store da cesta.
 * O ícone é uma adição ao DESIGN.md, que não define sistema de ícones:
 * Lucide com traço 1.5, como lá está previsto para os casos inevitáveis.
 */
export function CartLink({ count = 0, className }: { count?: number; className?: string }) {
  const label = count > 0 ? `Cesta, ${count} ${count === 1 ? "item" : "itens"}` : "Cesta, vazia";

  return (
    <Link
      href="/cesta"
      aria-label={label}
      className={cn(
        "relative inline-flex items-center gap-2 p-2 text-body hover:text-copper-300",
        className,
      )}
    >
      <ShoppingBasket aria-hidden="true" strokeWidth={1.5} className="size-5" />
      <span className="hidden font-accent text-eyebrow tracking-caps uppercase sm:inline">
        Cesta
      </span>
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 inline-flex size-4 items-center justify-center rounded-full bg-brand font-accent text-[10px] leading-none text-cream-50"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
