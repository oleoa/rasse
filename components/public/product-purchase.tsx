"use client";

import { useId, useState } from "react";
import { Price } from "@/components/public/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/lib/queries/products";

/**
 * Selector de variante e campo de personalização. O botão fica inerte nesta
 * fase — a Fase 4 liga-o à store da cesta.
 */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? null);
  const [personalization, setPersonalization] = useState("");
  const fieldId = useId();

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const priceCents =
    product.priceType === "on_request" || product.priceCents === null
      ? null
      : product.priceCents + (variant?.priceDeltaCents ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <Price
        priceType={product.priceType}
        priceCents={priceCents}
        className="text-h3 text-display"
      />

      {product.variants.length > 0 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="pb-3 font-accent text-[11px] tracking-caps text-subtle uppercase">
            {product.variantGroupLabel ?? "Opção"}
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  "cursor-pointer rounded-sm border px-4 py-2 font-accent text-eyebrow tracking-caps uppercase transition-colors",
                  v.id === variantId
                    ? "border-frame bg-brand/12 text-amber-500"
                    : "border-border text-body hover:border-copper-600",
                  "has-[:focus-visible]:shadow-(--focus-ring)",
                )}
              >
                <input
                  type="radio"
                  name="variante"
                  value={v.id}
                  checked={v.id === variantId}
                  onChange={() => setVariantId(v.id)}
                  className="sr-only"
                />
                {v.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {product.allowsPersonalization ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId}>{product.personalizationLabel ?? "Personalização"}</Label>
          <Input
            id={fieldId}
            value={personalization}
            onChange={(event) => setPersonalization(event.target.value)}
            aria-describedby={product.personalizationHelp ? `${fieldId}-help` : undefined}
          />
          {product.personalizationHelp ? (
            <p id={`${fieldId}-help`} className="text-small text-subtle">
              {product.personalizationHelp}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button type="button" size="lg" disabled aria-describedby={`${fieldId}-cesta`}>
          Adicionar à cesta
        </Button>
        <p id={`${fieldId}-cesta`} className="text-small text-subtle">
          A cesta entra em funcionamento na próxima fase.
        </p>
      </div>
    </div>
  );
}
