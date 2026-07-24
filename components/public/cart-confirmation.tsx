"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";

export type SentCart = {
  code: string;
  whatsappUrl: string;
  removedNames: string[];
};

/**
 * Vive fora da cesta: o envio limpa as linhas, e o código tem de continuar
 * visível depois disso.
 */
export function CartConfirmation({ code, whatsappUrl, removedNames }: SentCart) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-md border border-border p-8">
      <CopperRule />
      <Eyebrow>Pedido registado</Eyebrow>
      <h2 className="font-display text-h2 font-bold text-display">Guarda este código.</h2>
      <p className="text-small text-subtle">É por ele que encontramos o teu pedido na conversa.</p>

      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-sm border border-border bg-char-700 px-4 py-2 font-mono text-base text-display">
          {code}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copyCode}>
          {copied ? (
            <Check aria-hidden="true" strokeWidth={1.5} />
          ) : (
            <Copy aria-hidden="true" strokeWidth={1.5} />
          )}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <span aria-live="polite" className="sr-only">
          {copied ? "Código copiado." : ""}
        </span>
      </div>

      {removedNames.length > 0 ? (
        <p className="text-small text-danger">
          Ficaram de fora, por já não estarem disponíveis: {removedNames.join(", ")}.
        </p>
      ) : null}

      <p className="text-small text-subtle">
        A conversa do WhatsApp deve ter aberto noutro separador. Se não abriu, usa o botão.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <a href={whatsappUrl} target="_blank" rel="noreferrer noopener">
            Abrir o WhatsApp
          </a>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/produtos">Voltar ao catálogo</Link>
        </Button>
      </div>
    </div>
  );
}
