import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { carts, categories, products, quoteRequests } from "@/db/schema";

export type DashboardCounters = {
  produtosPublicados: number;
  produtosRascunho: number;
  categorias: number;
  pedidosNovos: number;
  pedidosTotal: number;
  orcamentosNovos: number;
  orcamentosTotal: number;
};

async function contar(query: Promise<Array<{ value: number }>>): Promise<number> {
  const [row] = await query;
  return Number(row?.value ?? 0);
}

export async function getDashboardCounters(): Promise<DashboardCounters> {
  const [
    produtosPublicados,
    produtosRascunho,
    totalCategorias,
    pedidosNovos,
    pedidosTotal,
    orcamentosNovos,
    orcamentosTotal,
  ] = await Promise.all([
    contar(db.select({ value: count() }).from(products).where(eq(products.status, "published"))),
    contar(db.select({ value: count() }).from(products).where(eq(products.status, "draft"))),
    contar(db.select({ value: count() }).from(categories)),
    contar(db.select({ value: count() }).from(carts).where(eq(carts.status, "novo"))),
    contar(db.select({ value: count() }).from(carts)),
    contar(
      db.select({ value: count() }).from(quoteRequests).where(eq(quoteRequests.status, "novo")),
    ),
    contar(db.select({ value: count() }).from(quoteRequests)),
  ]);

  return {
    produtosPublicados,
    produtosRascunho,
    categorias: totalCategorias,
    pedidosNovos,
    pedidosTotal,
    orcamentosNovos,
    orcamentosTotal,
  };
}
