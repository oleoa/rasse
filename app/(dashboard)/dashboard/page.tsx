import type { Metadata } from "next";
import { StatCard } from "@/components/dashboard/stat-card";
import { CopperRule } from "@/components/public/typography";
import { getDashboardCounters } from "@/lib/queries/dashboard";

export const metadata: Metadata = { title: "Visão geral" };

/** Contadores provisórios. Os gráficos entram na Fase 9. */
export default async function DashboardPage() {
  const c = await getDashboardCounters();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <CopperRule />
        <h1 className="font-display text-h2 font-bold text-display">Visão geral.</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pedidos novos"
          value={c.pedidosNovos}
          hint={`${c.pedidosTotal} no total`}
          href="/dashboard/pedidos"
        />
        <StatCard
          label="Orçamentos novos"
          value={c.orcamentosNovos}
          hint={`${c.orcamentosTotal} no total`}
          href="/dashboard/orcamentos"
        />
        <StatCard
          label="Produtos publicados"
          value={c.produtosPublicados}
          hint={`${c.produtosRascunho} em rascunho`}
          href="/dashboard/produtos"
        />
        <StatCard label="Categorias" value={c.categorias} href="/dashboard/categorias" />
      </div>

      <p className="text-small text-subtle">As métricas e os gráficos entram na fase 9.</p>
    </div>
  );
}
