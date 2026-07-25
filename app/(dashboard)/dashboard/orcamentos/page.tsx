import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Paginacao, RequestFilters } from "@/components/dashboard/request-filters";
import { EmptyState } from "@/components/public/empty-state";
import { CopperRule } from "@/components/public/typography";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { listQuotes } from "@/lib/queries/requests";
import { STATUS_LABEL, STATUS_VARIANT, type RequestStatus } from "@/lib/request-status";

export const metadata: Metadata = { title: "Orçamentos" };

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const status = (["novo", "contactado", "fechado", "perdido"] as const).find(
    (s) => s === params.status,
  );

  const { linhas, total, pagina, paginas } = await listQuotes({
    q: params.q?.trim() || undefined,
    status,
    pagina: Number(params.pagina) || 1,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <CopperRule />
        <h1 className="font-display text-h2 font-bold text-display">Orçamentos.</h1>
        <p className="max-w-[68ch] text-small text-subtle">
          Pedidos de peça personalizada, com os ficheiros que vieram do formulário.
        </p>
      </div>

      <Suspense fallback={<p className="text-small text-subtle">A carregar…</p>}>
        <RequestFilters
          base="/dashboard/orcamentos"
          filtros={{ q: params.q ?? "", status: status ?? "" }}
          placeholder="Código, nome ou contacto"
        />
      </Suspense>

      {total === 0 ? (
        <EmptyState
          title="Nenhum orçamento ainda."
          description="Aparecem aqui os pedidos feitos em /personalizado."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Código", "Data", "Nome", "Contacto", "Ficheiros", "Estado"].map((t) => (
                    <th
                      key={t}
                      className="p-3 font-accent text-eyebrow tracking-caps text-subtle uppercase"
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.id} className="border-b border-border hover:bg-card">
                    <td className="p-3">
                      <Link
                        href={`/dashboard/orcamentos/${linha.code}`}
                        className="font-mono text-small text-display hover:text-copper-300"
                      >
                        {linha.code}
                      </Link>
                    </td>
                    <td className="p-3 text-small text-subtle">
                      {formatDateTime(linha.createdAt)}
                    </td>
                    <td className="p-3 text-small text-body">{linha.name}</td>
                    <td className="p-3 text-small text-body">{linha.contact}</td>
                    <td className="p-3 text-small text-body">{linha.files.length}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[linha.status as RequestStatus]}>
                        {STATUS_LABEL[linha.status as RequestStatus]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Suspense fallback={null}>
            <Paginacao
              base="/dashboard/orcamentos"
              pagina={pagina}
              paginas={paginas}
              total={total}
              rotulo={total === 1 ? "orçamento" : "orçamentos"}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
