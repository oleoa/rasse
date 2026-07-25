"use client";

import { useState } from "react";
import { Markdown } from "@/lib/markdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 12,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  invalid?: boolean;
}) {
  const [aba, setAba] = useState<"escrever" | "prever">("escrever");

  return (
    <div className="flex flex-col gap-2">
      <div role="tablist" aria-label="Editor" className="flex gap-1">
        {(["escrever", "prever"] as const).map((nome) => (
          <button
            key={nome}
            type="button"
            role="tab"
            aria-selected={aba === nome}
            onClick={() => setAba(nome)}
            className={cn(
              "rounded-sm px-3 py-1.5 font-accent text-eyebrow tracking-caps uppercase transition-colors",
              aba === nome ? "bg-brand/12 text-amber-500" : "text-subtle hover:text-body",
            )}
          >
            {nome === "escrever" ? "Escrever" : "Pré-visualizar"}
          </button>
        ))}
      </div>

      {aba === "escrever" ? (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-small"
        />
      ) : (
        <div className="min-h-48 rounded-sm border border-input bg-char-700 px-3.5 py-2.5">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-small text-subtle">Nada para pré-visualizar.</p>
          )}
        </div>
      )}

      <p className="text-small text-subtle">
        Markdown: <code>**negrito**</code>, <code>*itálico*</code>, <code>## título</code>,{" "}
        <code>- lista</code>, <code>[link](url)</code>.
      </p>
    </div>
  );
}
