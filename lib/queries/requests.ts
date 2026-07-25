import "server-only";

import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts, quoteRequests } from "@/db/schema";
import type { RequestStatus } from "@/lib/request-status";

export const PAGE_SIZE = 20;

function paginacao(total: number, pagina: number) {
  return { total, pagina, paginas: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function listCarts(filtros: { q?: string; status?: RequestStatus; pagina?: number }) {
  const condicoes: SQL[] = [];

  if (filtros.q) {
    const termo = `%${filtros.q}%`;
    const busca = or(ilike(carts.code, termo), ilike(carts.customerName, termo));
    if (busca) condicoes.push(busca);
  }
  if (filtros.status) condicoes.push(eq(carts.status, filtros.status));

  const where = condicoes.length > 0 ? and(...condicoes) : undefined;
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const [linhas, [total]] = await Promise.all([
    db.query.carts.findMany({
      where,
      orderBy: [desc(carts.createdAt)],
      limit: PAGE_SIZE,
      offset: (pagina - 1) * PAGE_SIZE,
      with: { items: true },
    }),
    db.select({ value: count() }).from(carts).where(where),
  ]);

  return { linhas, ...paginacao(Number(total?.value ?? 0), pagina) };
}

export type CartDetail = NonNullable<Awaited<ReturnType<typeof getCartByCode>>>;

export async function getCartByCode(code: string) {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.code, code),
    with: { items: { orderBy: [cartItems.productNameSnapshot] } },
  });

  return cart ?? null;
}

export async function listQuotes(filtros: { q?: string; status?: RequestStatus; pagina?: number }) {
  const condicoes: SQL[] = [];

  if (filtros.q) {
    const termo = `%${filtros.q}%`;
    const busca = or(
      ilike(quoteRequests.code, termo),
      ilike(quoteRequests.name, termo),
      ilike(quoteRequests.contact, termo),
    );
    if (busca) condicoes.push(busca);
  }
  if (filtros.status) condicoes.push(eq(quoteRequests.status, filtros.status));

  const where = condicoes.length > 0 ? and(...condicoes) : undefined;
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const [linhas, [total]] = await Promise.all([
    db.query.quoteRequests.findMany({
      where,
      orderBy: [desc(quoteRequests.createdAt)],
      limit: PAGE_SIZE,
      offset: (pagina - 1) * PAGE_SIZE,
      with: { files: true },
    }),
    db.select({ value: count() }).from(quoteRequests).where(where),
  ]);

  return { linhas, ...paginacao(Number(total?.value ?? 0), pagina) };
}

export type QuoteDetail = NonNullable<Awaited<ReturnType<typeof getQuoteByCode>>>;

export async function getQuoteByCode(code: string) {
  const quote = await db.query.quoteRequests.findFirst({
    where: eq(quoteRequests.code, code),
    with: { files: true },
  });

  return quote ?? null;
}

/** Para o badge de "novos" na sidebar. */
export async function countNovos(): Promise<{ pedidos: number; orcamentos: number }> {
  const [[pedidos], [orcamentos]] = await Promise.all([
    db.select({ value: count() }).from(carts).where(eq(carts.status, "novo")),
    db.select({ value: count() }).from(quoteRequests).where(eq(quoteRequests.status, "novo")),
  ]);

  return { pedidos: Number(pedidos?.value ?? 0), orcamentos: Number(orcamentos?.value ?? 0) };
}
