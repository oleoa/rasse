import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Agrega os eventos de um dia em `event_daily`.
 *
 * Idempotente: o `ON CONFLICT` escreve o valor recontado por cima, em vez de
 * somar. Correr duas vezes para o mesmo dia dá exactamente o mesmo resultado.
 *
 * O dia é o dia civil em `America/Sao_Paulo`, não em UTC — senão a fronteira
 * ficava às 21h para quem está no Brasil.
 */
export async function aggregateDay(date: string): Promise<{ linhas: number }> {
  const resultado = await db.execute(sql`
    insert into event_daily (date, type, product_id, count)
    select
      (created_at at time zone 'America/Sao_Paulo')::date as date,
      type,
      product_id,
      count(*)::int as count
    from events
    where (created_at at time zone 'America/Sao_Paulo')::date = ${date}::date
    group by 1, 2, 3
    on conflict on constraint event_daily_pk
      do update set count = excluded.count
    returning 1
  `);

  const linhas = Array.isArray(resultado) ? resultado : (resultado.rows ?? []);
  return { linhas: linhas.length };
}

/** Ontem e hoje, para apanhar eventos que chegaram depois da meia-noite. */
export async function aggregateRecent(): Promise<{ dias: string[]; linhas: number }> {
  const dias = await db.execute(sql`
    select to_char(d, 'YYYY-MM-DD') as dia
    from generate_series(
      (now() at time zone 'America/Sao_Paulo')::date - interval '1 day',
      (now() at time zone 'America/Sao_Paulo')::date,
      interval '1 day'
    ) as d
  `);

  const lista = (Array.isArray(dias) ? dias : (dias.rows ?? [])) as Array<{ dia: string }>;
  let total = 0;

  for (const { dia } of lista) {
    const { linhas } = await aggregateDay(dia);
    total += linhas;
  }

  return { dias: lista.map((d) => d.dia), linhas: total };
}
