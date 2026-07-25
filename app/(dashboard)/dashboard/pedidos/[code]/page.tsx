import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestControls } from "@/components/dashboard/request-controls";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDateTime } from "@/lib/format";
import { getCartByCode } from "@/lib/queries/requests";
import { STATUS_LABEL, STATUS_VARIANT, type RequestStatus } from "@/lib/request-status";
import { getSettings } from "@/lib/queries/settings";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Pedido" };

export default async function PedidoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [pedido, settings] = await Promise.all([getCartByCode(code), getSettings()]);

  if (!pedido) notFound();

  const total = pedido.items.reduce((t, i) => t + (i.unitPriceCentsSnapshot ?? 0) * i.quantity, 0);
  const sobConsulta = pedido.items.some((i) => i.unitPriceCentsSnapshot === null);

  const mensagem = [
    `Olá! Sobre o pedido ${pedido.code}:`,
    "",
    ...pedido.items.map(
      (i) =>
        `• ${i.quantity}x ${i.productNameSnapshot}${i.variantNameSnapshot ? ` (${i.variantNameSnapshot})` : ""}`,
    ),
  ].join("\n");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h1 className="font-display text-h2 font-bold tracking-caps text-display">
            {pedido.code}
          </h1>
        </div>
        <Badge variant={STATUS_VARIANT[pedido.status as RequestStatus]}>
          {STATUS_LABEL[pedido.status as RequestStatus]}
        </Badge>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Eyebrow>Recebido</Eyebrow>
            <p className="text-base text-body">{formatDateTime(pedido.createdAt)}</p>
            {pedido.customerName ? (
              <p className="text-base text-body">Nome: {pedido.customerName}</p>
            ) : (
              <p className="text-small text-subtle">O cliente não deixou nome.</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <CopperRule />
            <h2 className="font-display text-h3 font-bold text-display">Itens</h2>

            <ul className="flex flex-col divide-y divide-border">
              {pedido.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-body">
                      {item.quantity}× {item.productNameSnapshot}
                    </p>
                    {item.variantNameSnapshot ? (
                      <p className="text-small text-subtle">{item.variantNameSnapshot}</p>
                    ) : null}
                    {item.personalizationText ? (
                      <p className="text-small break-words text-amber-500">
                        Personalização: “{item.personalizationText}”
                      </p>
                    ) : null}
                    {item.productId === null ? (
                      <p className="text-small text-subtle">
                        O produto foi apagado do catálogo; o registo do pedido mantém-se.
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 font-accent text-small tracking-caps text-display">
                    {item.unitPriceCentsSnapshot === null
                      ? "A combinar"
                      : formatBRL(item.unitPriceCentsSnapshot * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
              <span className="font-accent text-eyebrow tracking-caps text-subtle uppercase">
                {sobConsulta ? "Subtotal parcial" : "Total"}
              </span>
              <span className="font-accent text-h3 tracking-caps text-display">
                {formatBRL(total)}
              </span>
            </div>
            {sobConsulta ? (
              <p className="text-small text-subtle">
                Há itens sob consulta que não entram neste valor.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {settings ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={whatsappUrl(settings.whatsappNumber, mensagem)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Abrir mensagem no WhatsApp
                </a>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/pedidos">Voltar</Link>
            </Button>
          </div>
        </div>

        <aside className="flex h-fit flex-col gap-6 rounded-md border border-border p-6">
          <RequestControls
            tipo="pedido"
            code={pedido.code}
            status={pedido.status as RequestStatus}
            internalNotes={pedido.internalNotes}
          />
        </aside>
      </div>
    </div>
  );
}
