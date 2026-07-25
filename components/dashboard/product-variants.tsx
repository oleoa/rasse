"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";

export type VariantDraft = { id: string | null; name: string; priceDeltaCents: number };

const MAX_VARIANTES = 20;

export function ProductVariants({
  variants,
  basePriceCents,
  onChange,
}: {
  variants: VariantDraft[];
  basePriceCents: number | null;
  onChange: (variants: VariantDraft[]) => void;
}) {
  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= variants.length) return;
    const copia = [...variants];
    const [item] = copia.splice(index, 1);
    if (item) copia.splice(destino, 0, item);
    onChange(copia);
  }

  function alterar(index: number, mudanca: Partial<VariantDraft>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...mudanca } : v)));
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.length === 0 ? (
        <p className="text-small text-subtle">
          Sem variantes. O produto é vendido numa versão única.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {variants.map((variante, index) => {
            const final =
              basePriceCents === null ? null : basePriceCents + variante.priceDeltaCents;

            return (
              <li
                key={index}
                className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3"
              >
                <div className="flex min-w-40 flex-1 flex-col gap-1">
                  <Label htmlFor={`variante-nome-${index}`}>Nome</Label>
                  <Input
                    id={`variante-nome-${index}`}
                    value={variante.name}
                    maxLength={60}
                    aria-invalid={variante.name.trim().length === 0}
                    onChange={(e) => alterar(index, { name: e.target.value })}
                  />
                </div>

                <div className="flex w-40 flex-col gap-1">
                  <Label htmlFor={`variante-delta-${index}`}>Diferença (R$)</Label>
                  <Input
                    id={`variante-delta-${index}`}
                    type="number"
                    step="0.01"
                    value={(variante.priceDeltaCents / 100).toFixed(2)}
                    onChange={(e) =>
                      alterar(index, {
                        priceDeltaCents: Math.round(Number(e.target.value || 0) * 100),
                      })
                    }
                  />
                </div>

                <p className="min-w-28 pb-2.5 text-small text-subtle">
                  {final === null ? "Sob consulta" : formatBRL(final)}
                </p>

                <div className="flex shrink-0 items-center gap-1 pb-1.5">
                  <button
                    type="button"
                    onClick={() => mover(index, -1)}
                    disabled={index === 0}
                    aria-label="Subir variante"
                    className="p-1 text-subtle hover:text-copper-300 disabled:opacity-30"
                  >
                    <ArrowUp aria-hidden="true" strokeWidth={1.5} className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(index, 1)}
                    disabled={index === variants.length - 1}
                    aria-label="Descer variante"
                    className="p-1 text-subtle hover:text-copper-300 disabled:opacity-30"
                  >
                    <ArrowDown aria-hidden="true" strokeWidth={1.5} className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(variants.filter((_, i) => i !== index))}
                    aria-label={`Remover variante ${variante.name || index + 1}`}
                    className="p-1 text-subtle hover:text-danger"
                  >
                    <X aria-hidden="true" strokeWidth={1.5} className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={variants.length >= MAX_VARIANTES}
          onClick={() => onChange([...variants, { id: null, name: "", priceDeltaCents: 0 }])}
        >
          <Plus aria-hidden="true" strokeWidth={1.5} />
          Adicionar variante
        </Button>
      </div>
    </div>
  );
}
