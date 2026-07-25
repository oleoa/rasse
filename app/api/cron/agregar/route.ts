import { NextResponse } from "next/server";
import { aggregateRecent } from "@/lib/mutations/aggregate";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Agregação diária dos eventos, chamada pelo Vercel Cron às 03:00 de
 * America/Sao_Paulo (06:00 UTC — o cron da Vercel só aceita UTC).
 *
 * A Vercel assina os pedidos de cron com o header `x-vercel-cron`; em produção
 * exigimos também o CRON_SECRET, para o endpoint não ser público.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");
  const daVercel = request.headers.get("x-vercel-cron") !== null;

  if (secret && autorizacao !== `Bearer ${secret}` && !daVercel) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const resultado = await aggregateRecent();
  return NextResponse.json({ ok: true, ...resultado });
}
