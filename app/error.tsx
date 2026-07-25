"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/public/container";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // O digest é o que liga esta tela à entrada nos logs da Vercel.
    console.error("Erro na aplicação:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col justify-center">
      <Container className="flex flex-col items-center gap-6 py-24 text-center">
        <CopperRule />
        <Eyebrow>Erro 500</Eyebrow>
        <h1 className="font-display text-h1 font-bold text-display">Alguma coisa correu mal.</h1>
        <p className="max-w-[52ch] text-base text-subtle">
          Já registramos o problema. Tente de novo; se continuar, fale conosco pelo WhatsApp.
        </p>
        {error.digest ? (
          <code className="rounded-sm border border-border bg-char-700 px-3 py-1.5 font-mono text-small text-subtle">
            {error.digest}
          </code>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={reset}>
            Tentar de novo
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
