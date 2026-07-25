import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { isValidPreviewToken } from "@/lib/preview";

/**
 * Um produto por slug **sem** filtrar pelo estado, desde que o token bata certo.
 * É o único caminho que devolve rascunhos ao público, e exige o HMAC gerado
 * pelo painel.
 */
export async function getProductForPreview(slug: string, token: string | undefined) {
  if (!token) return null;

  const produto = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      images: { orderBy: (i, { asc }) => [asc(i.position)] },
      variants: { orderBy: (v, { asc }) => [asc(v.position)] },
    },
  });

  if (!produto) return null;
  if (!isValidPreviewToken(produto.id, token)) return null;

  return produto;
}
