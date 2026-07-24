import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceProps = {
  priceType: "fixed" | "on_request";
  priceCents: number | null;
  className?: string;
};

export function Price({ priceType, priceCents, className }: PriceProps) {
  if (priceType === "on_request" || priceCents === null) {
    return (
      <span className={cn("font-accent text-small tracking-caps text-subtle uppercase", className)}>
        Sob consulta
      </span>
    );
  }

  return (
    <span className={cn("font-accent text-small tracking-caps text-display", className)}>
      {formatBRL(priceCents)}
    </span>
  );
}
