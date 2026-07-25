import type { Metadata } from "next";
import Link from "next/link";
import { SemanasChart, TopProdutosLista, VisitasChart } from "@/components/dashboard/charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { CopperRule } from "@/components/public/typography";
import { getDashboardCounters } from "@/lib/queries/dashboard";
import {
  porSemana,
  resumo,
  topProdutos,
  visitasPorDia,
  type Periodo,
} from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Visão geral" };

const PERIODOS: Periodo[] = [7, 30, 90];

function Painel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-card p-6">
      <h2 className="font-accent text-eyebrow tracking-eyebrow text-subtle uppercase">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: bruto } = await searchParams;
  const periodo: Periodo = PERIODOS.find((p) => String(p) === bruto) ?? 30;

  const [contadores, metricas, visitas, maisVistos, maisAdicionados, cestas, orcamentos] =
    await Promise.all([
      getDashboardCounters(),
      resumo(periodo),
      visitasPorDia(periodo),
      topProdutos("product_view", periodo),
      topProdutos("add_to_cart", periodo),
      porSemana("cart_sent", periodo),
      porSemana("quote_submitted", periodo),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h1 className="font-display text-h2 font-bold text-display">Visão geral.</h1>
        </div>

        <nav aria-label="Período" className="flex gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={`/dashboard?periodo=${p}`}
              aria-current={p === periodo ? "page" : undefined}
              className={cn(
                "rounded-sm border px-4 py-2 font-accent text-eyebrow tracking-caps uppercase transition-colors",
                p === periodo
                  ? "border-frame bg-brand/12 text-amber-500"
                  : "border-border text-body hover:border-copper-600",
              )}
            >
              {p} dias
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pedidos novos"
          value={contadores.pedidosNovos}
          hint={`${contadores.pedidosTotal} no total`}
          href="/dashboard/pedidos"
        />
        <StatCard
          label="Orçamentos novos"
          value={contadores.orcamentosNovos}
          hint={`${contadores.orcamentosTotal} no total`}
          href="/dashboard/orcamentos"
        />
        <StatCard
          label="Produtos publicados"
          value={contadores.produtosPublicados}
          hint={`${contadores.produtosRascunho} em rascunho`}
          href="/dashboard/produtos"
        />
        <StatCard label="Visitas" value={metricas.visitas} hint={`últimos ${periodo} dias`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Adições à cesta" value={metricas.adicoes} hint={`${periodo} dias`} />
        <StatCard
          label="Cestas enviadas"
          value={metricas.cestasEnviadas}
          hint={`${periodo} dias`}
        />
        <StatCard label="Orçamentos pedidos" value={metricas.orcamentos} hint={`${periodo} dias`} />
        <StatCard
          label="Cesta → envio"
          value={metricas.taxaConversao === null ? "—" : `${metricas.taxaConversao}%`}
          hint="de quem adiciona, quantos enviam"
        />
      </div>

      <Painel titulo={`Visitas por dia · ${periodo} dias`}>
        <VisitasChart dados={visitas} />
      </Painel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Mais vistos">
          <TopProdutosLista dados={maisVistos} rotulo="Produtos vistos" />
        </Painel>
        <Painel titulo="Mais adicionados à cesta">
          <TopProdutosLista dados={maisAdicionados} rotulo="Produtos adicionados" />
        </Painel>
        <Painel titulo="Cestas enviadas por semana">
          <SemanasChart dados={cestas} rotulo="Cestas" />
        </Painel>
        <Painel titulo="Orçamentos por semana">
          <SemanasChart dados={orcamentos} rotulo="Orçamentos" cor="var(--chart-3)" />
        </Painel>
      </div>

      <p className="text-small text-subtle">
        Os números vêm da agregação diária, que corre às 03:00. Eventos de hoje só aparecem depois
        dela. O painel não conta as tuas próprias visitas.
      </p>
    </div>
  );
}
