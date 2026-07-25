import "server-only";

import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, type Category } from "@/db/schema";

export const PAGE_SIZE = 20;

export type AdminProductFilters = {
  q?: string;
  status?: "draft" | "published" | "archived";
  categoria?: string;
  pagina?: number;
};

export async function listAdminProducts(filters: AdminProductFilters) {
  const condicoes: SQL[] = [];

  if (filters.q) {
    const termo = `%${filters.q}%`;
    const busca = or(ilike(products.name, termo), ilike(products.slug, termo));
    if (busca) condicoes.push(busca);
  }
  if (filters.status) condicoes.push(eq(products.status, filters.status));
  if (filters.categoria) condicoes.push(eq(products.categoryId, filters.categoria));

  const where = condicoes.length > 0 ? and(...condicoes) : undefined;
  const pagina = Math.max(1, filters.pagina ?? 1);

  const [linhas, [total]] = await Promise.all([
    db.query.products.findMany({
      where,
      orderBy: [asc(products.position), desc(products.updatedAt)],
      limit: PAGE_SIZE,
      offset: (pagina - 1) * PAGE_SIZE,
      with: {
        category: true,
        images: { orderBy: (i, { asc: a }) => [a(i.position)], limit: 1 },
      },
    }),
    db.select({ value: count() }).from(products).where(where),
  ]);

  const totalLinhas = Number(total?.value ?? 0);

  return {
    linhas,
    total: totalLinhas,
    pagina,
    paginas: Math.max(1, Math.ceil(totalLinhas / PAGE_SIZE)),
  };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export async function getAdminProduct(id: string) {
  const produto = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: true,
      images: { orderBy: (i, { asc: a }) => [a(i.position)] },
      variants: { orderBy: (v, { asc: a }) => [a(v.position)] },
    },
  });

  return produto ?? null;
}

export type CategoryWithCount = Category & { produtos: number };

export async function listCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const linhas = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      position: categories.position,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      produtos: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.position), asc(categories.name));

  return linhas.map((linha) => ({ ...linha, produtos: Number(linha.produtos) }));
}
