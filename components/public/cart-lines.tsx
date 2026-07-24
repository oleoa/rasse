"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { imageUrl, isUnoptimized } from "@/lib/images";
import { MAX_QUANTITY, useCartStore, type CartLine } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

export function CartLines({
  lines,
  compact = false,
  unavailableIds = [],
}: {
  lines: CartLine[];
  compact?: boolean;
  unavailableIds?: string[];
}) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  return (
    <ul className="flex flex-col divide-y divide-border">
      {lines.map((line) => {
        const unavailable = unavailableIds.includes(line.productId);

        return (
          <li key={line.key} className={cn("flex gap-4 py-5", unavailable && "opacity-60")}>
            {line.imageKey ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-sm border border-border bg-char-700">
                <Image
                  src={imageUrl(line.imageKey)}
                  alt=""
                  fill
                  unoptimized={isUnoptimized(line.imageKey)}
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/produtos/${line.productSlug}`}
                    className="block truncate font-display font-bold text-display hover:text-copper-300"
                  >
                    {line.productName}
                  </Link>
                  {line.variantName ? (
                    <p className="text-small text-subtle">{line.variantName}</p>
                  ) : null}
                  {line.personalizationText ? (
                    <p className="text-small break-words text-subtle">
                      “{line.personalizationText}”
                    </p>
                  ) : null}
                  {unavailable ? (
                    <p className="text-small text-danger">Já não está disponível.</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  aria-label={`Remover ${line.productName} da cesta`}
                  className="shrink-0 p-1 text-subtle hover:text-danger"
                >
                  <X aria-hidden="true" strokeWidth={1.5} className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center rounded-sm border border-border">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity - 1)}
                    aria-label={`Diminuir quantidade de ${line.productName}`}
                    className="px-2 py-1 text-body hover:text-copper-300"
                  >
                    <Minus aria-hidden="true" strokeWidth={1.5} className="size-4" />
                  </button>
                  <span
                    aria-live="polite"
                    className="min-w-8 text-center font-accent text-small text-display"
                  >
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity + 1)}
                    disabled={line.quantity >= MAX_QUANTITY}
                    aria-label={`Aumentar quantidade de ${line.productName}`}
                    className="px-2 py-1 text-body hover:text-copper-300 disabled:opacity-45"
                  >
                    <Plus aria-hidden="true" strokeWidth={1.5} className="size-4" />
                  </button>
                </div>

                <span className="font-accent text-small tracking-caps">
                  {line.unitPriceCents === null ? (
                    <span className="text-subtle uppercase">A combinar</span>
                  ) : (
                    <span className="text-display">
                      {formatBRL(line.unitPriceCents * line.quantity)}
                    </span>
                  )}
                </span>
              </div>

              {!compact && line.unitPriceCents !== null && line.quantity > 1 ? (
                <p className="text-small text-subtle">{formatBRL(line.unitPriceCents)} cada</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
