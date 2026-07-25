import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";

export type Periodo = 7 | 30 | 90;

function linhas<T>(resultado: unknown): T[] {
  if (Array.isArray(resultado)) return resultado as T[];
  return ((resultado as { rows?: T[] }).rows ?? []) as T[];
}

export type PontoDiario = { dia: string; visitas: number };

/**
 * Série de visitas por dia, com os dias sem eventos a zero — senão o gráfico
 * salta buracos e mente sobre a forma da curva.
 */
export async function visitasPorDia(dias: Periodo): Promise<PontoDiario[]> {
  const resultado = await db.execute(sql`
    with intervalo as (
      select generate_series(
        (now() at time zone 'America/Sao_Paulo')::date - make_interval(days => ${dias - 1}),
        (now() at time zone 'America/Sao_Paulo')::date,
        interval '1 day'
      )::date as dia
    )
    select
      to_char(intervalo.dia, 'YYYY-MM-DD') as dia,
      coalesce(sum(e.count), 0)::int as visitas
    from intervalo
    left join event_daily e
      on e.date = intervalo.dia and e.type = 'page_view'
    group by intervalo.dia
    order by intervalo.dia
  `);

  return linhas<PontoDiario>(resultado);
}

export type PontoSemanal = { semana: string; total: number };

export async function porSemana(
  tipo: "cart_sent" | "quote_submitted",
  dias: Periodo,
): Promise<PontoSemanal[]> {
  const resultado = await db.execute(sql`
    with intervalo as (
      select generate_series(
        date_trunc('week', (now() at time zone 'America/Sao_Paulo')::date - make_interval(days => ${dias - 1})),
        date_trunc('week', (now() at time zone 'America/Sao_Paulo')::date),
        interval '1 week'
      )::date as semana
    )
    select
      to_char(intervalo.semana, 'DD/MM') as semana,
      coalesce(sum(e.count), 0)::int as total
    from intervalo
    left join event_daily e
      on date_trunc('week', e.date) = intervalo.semana and e.type = ${tipo}
    group by intervalo.semana
    order by intervalo.semana
  `);

  return linhas<PontoSemanal>(resultado);
}

export type TopProduto = { nome: string; slug: string; total: number };

export async function topProdutos(
  tipo: "product_view" | "add_to_cart",
  dias: Periodo,
  limite = 10,
): Promise<TopProduto[]> {
  const resultado = await db.execute(sql`
    select p.name as nome, p.slug as slug, sum(e.count)::int as total
    from event_daily e
    join products p on p.id = e.product_id
    where e.type = ${tipo}
      and e.date >= (now() at time zone 'America/Sao_Paulo')::date - make_interval(days => ${dias - 1})
    group by p.id, p.name, p.slug
    order by total desc, p.name
    limit ${limite}
  `);

  return linhas<TopProduto>(resultado);
}

export type Resumo = {
  visitas: number;
  adicoes: number;
  cestasEnviadas: number;
  orcamentos: number;
  /** add_to_cart → cart_sent, em porcentagem. */
  taxaConversao: number | null;
};

export async function resumo(dias: Periodo): Promise<Resumo> {
  const resultado = await db.execute(sql`
    select
      coalesce(sum(count) filter (where type = 'page_view'), 0)::int as visitas,
      coalesce(sum(count) filter (where type = 'add_to_cart'), 0)::int as adicoes,
      coalesce(sum(count) filter (where type = 'cart_sent'), 0)::int as cestas,
      coalesce(sum(count) filter (where type = 'quote_submitted'), 0)::int as orcamentos
    from event_daily
    where date >= (now() at time zone 'America/Sao_Paulo')::date - make_interval(days => ${dias - 1})
  `);

  const [linha] = linhas<{ visitas: number; adicoes: number; cestas: number; orcamentos: number }>(
    resultado,
  );

  const adicoes = Number(linha?.adicoes ?? 0);
  const cestas = Number(linha?.cestas ?? 0);

  return {
    visitas: Number(linha?.visitas ?? 0),
    adicoes,
    cestasEnviadas: cestas,
    orcamentos: Number(linha?.orcamentos ?? 0),
    taxaConversao: adicoes > 0 ? Math.round((cestas / adicoes) * 1000) / 10 : null,
  };
}
