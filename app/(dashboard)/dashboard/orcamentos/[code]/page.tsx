import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteFiles } from "@/components/dashboard/quote-files";
import { RequestControls } from "@/components/dashboard/request-controls";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { whatsappFromContact } from "@/lib/contact";
import { formatDateTime } from "@/lib/format";
import { getQuoteByCode } from "@/lib/queries/requests";
import { STATUS_LABEL, STATUS_VARIANT, type RequestStatus } from "@/lib/request-status";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Orçamento" };

export default async function OrcamentoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const orcamento = await getQuoteByCode(code);

  if (!orcamento) notFound();

  const numero = whatsappFromContact(orcamento.contact);
  const mensagem = `Olá ${orcamento.name}! Sobre o seu pedido ${orcamento.code}:`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h1 className="font-display text-h2 font-bold tracking-caps text-display">
            {orcamento.code}
          </h1>
        </div>
        <Badge variant={STATUS_VARIANT[orcamento.status as RequestStatus]}>
          {STATUS_LABEL[orcamento.status as RequestStatus]}
        </Badge>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Eyebrow>Recebido</Eyebrow>
            <p className="text-base text-body">{formatDateTime(orcamento.createdAt)}</p>
            <p className="text-base text-body">{orcamento.name}</p>
            <p className="text-base text-body">{orcamento.contact}</p>
          </div>

          <div className="flex flex-col gap-4">
            <CopperRule />
            <h2 className="font-display text-h3 font-bold text-display">A peça</h2>
            <p className="max-w-[68ch] text-base leading-[1.6] whitespace-pre-wrap text-body">
              {orcamento.message}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <CopperRule />
            <h2 className="font-display text-h3 font-bold text-display">
              Arquivos ({orcamento.files.length})
            </h2>
            <QuoteFiles
              code={orcamento.code}
              files={orcamento.files.map((f) => ({
                id: f.id,
                filename: f.filename,
                mime: f.mime,
                sizeBytes: f.sizeBytes,
              }))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {numero ? (
              <Button asChild variant="outline" size="sm">
                <a href={whatsappUrl(numero, mensagem)} target="_blank" rel="noreferrer noopener">
                  Falar com o cliente no WhatsApp
                </a>
              </Button>
            ) : (
              <p className="text-small text-subtle">
                O contato não parece um número de telefone; responde por email.
              </p>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/orcamentos">Voltar</Link>
            </Button>
          </div>
        </div>

        <aside className="flex h-fit flex-col gap-6 rounded-md border border-border p-6">
          <RequestControls
            tipo="orcamento"
            code={orcamento.code}
            status={orcamento.status as RequestStatus}
            internalNotes={orcamento.internalNotes}
          />
        </aside>
      </div>
    </div>
  );
}
