"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Price } from "@/components/public/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_LINES, useCartStore } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/lib/queries/products";

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? null);
  const [personalization, setPersonalization] = useState("");
  const [added, setAdded] = useState(false);
  const addLine = useCartStore((s) => s.addLine);
  const { lines } = useCart();
  const fieldId = useId();

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const priceCents =
    product.priceType === "on_request" || product.priceCents === null
      ? null
      : product.priceCents + (variant?.priceDeltaCents ?? 0);

  const cheio = lines.length >= MAX_LINES;

  function handleAdd() {
    const texto = personalization.trim();

    addLine({
      productId: product.id,
      variantId,
      quantity: 1,
      personalizationText: product.allowsPersonalization && texto ? texto : null,
      productName: product.name,
      productSlug: product.slug,
      variantName: variant?.name ?? null,
      unitPriceCents: priceCents,
      imageKey: product.images[0]?.r2Key ?? null,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

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
                  "has-focus-visible:shadow-(--focus-ring)",
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
            maxLength={200}
            aria-describedby={product.personalizationHelp ? `${fieldId}-help` : undefined}
          />
          {product.personalizationHelp ? (
            <p id={`${fieldId}-help`} className="text-small text-subtle">
              {product.personalizationHelp}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button type="button" size="lg" onClick={handleAdd} disabled={cheio}>
          Adicionar à cesta
        </Button>

        <p aria-live="polite" className="text-small">
          {cheio ? (
            <span className="text-danger">
              A cesta chegou ao limite de {MAX_LINES} linhas. Envia o pedido ou remove alguma peça.
            </span>
          ) : added ? (
            <span className="text-subtle">
              Adicionado. <Link href="/cesta">Ver a cesta</Link>
            </span>
          ) : (
            <span className="text-subtle">O preço final é combinado no WhatsApp.</span>
          )}
        </p>
      </div>
    </div>
  );
}
