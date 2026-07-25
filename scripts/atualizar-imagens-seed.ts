import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, like } from "drizzle-orm";
import { productImages, products } from "../db/schema.ts";
import { IMAGEM_ALTURA, IMAGEM_LARGURA, SEED_PRODUCTS } from "../db/seed-data.ts";

/**
 * Troca as imagens de demonstração dos produtos pelas de `db/seed-data.ts`.
 *
 *   pnpm db:imagens
 *
 * Existe porque o `db/seed.ts` só insere: o único caminho para reaproveitá-lo
 * é o `pnpm db:reset`, que apaga pedidos e orçamentos já recebidos. Este
 * script mexe apenas nas linhas com chave `seed/`, deixando intactas as
 * imagens enviadas pelo painel.
 *
 * É idempotente: rodar duas vezes dá o mesmo resultado.
 */

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL ausente. Rode com --env-file=.env.local.");
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Este script se recusa a rodar com NODE_ENV=production.");
}

const db = drizzle({ client: neon(url), casing: "snake_case" });

let atualizados = 0;
let semProduto = 0;

for (const produto of SEED_PRODUCTS) {
  const [linha] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, produto.slug));

  if (!linha) {
    process.stdout.write(`  ignorado: não há produto com o endereço ${produto.slug}\n`);
    semProduto += 1;
    continue;
  }

  await db
    .delete(productImages)
    .where(and(eq(productImages.productId, linha.id), like(productImages.r2Key, "seed/%")));

  // As imagens enviadas pelo painel ficam onde estão; as de demonstração
  // entram depois delas.
  const restantes = await db
    .select({ position: productImages.position })
    .from(productImages)
    .where(eq(productImages.productId, linha.id));

  const inicio = restantes.reduce((maior, r) => Math.max(maior, r.position + 1), 0);

  await db.insert(productImages).values(
    produto.images.map((imagem, indice) => ({
      productId: linha.id,
      r2Key: `seed/${imagem.file}`,
      alt: imagem.alt,
      width: IMAGEM_LARGURA,
      height: IMAGEM_ALTURA,
      position: inicio + indice,
    })),
  );

  atualizados += 1;
}

process.stdout.write(
  [
    `Imagens de demonstração atualizadas em ${new URL(url).hostname}.`,
    `  produtos atualizados: ${atualizados}`,
    `  produtos ausentes:    ${semProduto}`,
    "",
  ].join("\n"),
);
