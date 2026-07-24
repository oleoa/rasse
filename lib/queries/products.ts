import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

/**
 * Só `published` sai daqui. `draft` e `archived` não aparecem em listagens nem
 * em rota directa — é o que a Fase 3 exige.
 */
const PUBLISHED = eq(products.status, "published");

export type ProductListItem = Awaited<ReturnType<typeof getPublishedProducts>>[number];
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getPublishedProducts(categorySlug?: string) {
  const categoryId = categorySlug ? await findCategoryId(categorySlug) : undefined;

  if (categorySlug && !categoryId) return [];

  return db.query.products.findMany({
    where: categoryId ? and(PUBLISHED, eq(products.categoryId, categoryId)) : PUBLISHED,
    orderBy: [asc(products.position), asc(products.name)],
    with: {
      category: true,
      images: { orderBy: (image, { asc: ascending }) => [ascending(image.position)], limit: 1 },
    },
  });
}

export async function getFeaturedProducts(limit = 6) {
  return db.query.products.findMany({
    where: and(PUBLISHED, eq(products.isFeatured, true)),
    orderBy: [asc(products.position), asc(products.name)],
    limit,
    with: {
      category: true,
      images: { orderBy: (image, { asc: ascending }) => [ascending(image.position)], limit: 1 },
    },
  });
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(PUBLISHED, eq(products.slug, slug)),
    with: {
      category: true,
      images: { orderBy: (image, { asc: ascending }) => [ascending(image.position)] },
      variants: { orderBy: (variant, { asc: ascending }) => [ascending(variant.position)] },
    },
  });

  return product ?? null;
}

export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 3) {
  return db.query.products.findMany({
    where: and(PUBLISHED, eq(products.categoryId, categoryId), ne(products.id, excludeProductId)),
    orderBy: [asc(products.position), asc(products.name)],
    limit,
    with: {
      category: true,
      images: { orderBy: (image, { asc: ascending }) => [ascending(image.position)], limit: 1 },
    },
  });
}

export async function getPublishedProductSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: products.slug }).from(products).where(PUBLISHED);
  return rows.map((row) => row.slug);
}

async function findCategoryId(slug: string): Promise<string | undefined> {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return row?.id;
}
