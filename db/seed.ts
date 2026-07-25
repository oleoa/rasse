import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { categories, productImages, productVariants, products, settings } from "./schema.ts";
import { IMAGEM_ALTURA, IMAGEM_LARGURA, SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data.ts";

// Este seed não cria usuários. Administradores são criados com
// `pnpm user:create`, que pede a senha no stdin — assim não há credenciais
// em arquivos nem no histórico da shell.
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL ausente. Rode com --env-file=.env.local.");
}

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed se recusa a rodar com NODE_ENV=production.");
}

const db = drizzle({ client: neon(url), casing: "snake_case" });

async function main() {
  await db.insert(settings).values({
    id: 1,
    whatsappNumber: "550000000000",
    businessName: "Oficina Rassë",
    heroTitle: "Explore o autêntico.",
    heroSubtitle: "Gravação em madeira e impressão 3D, peça a peça.",
    instagramUrl: "https://www.instagram.com/oficinarasse/",
    aboutMd:
      "Somos a Rassë.\n\nUma oficina-ateliê que trabalha madeira gravada a laser e impressão 3D. Cada peça sai daqui lixada, conferida e embalada à mão.\n\nA beleza do rústico. Feito para durar.",
    cnpj: null,
    contactEmail: null,
  });

  const insertedCategories = await db.insert(categories).values(SEED_CATEGORIES).returning();
  const categoryIdBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  for (const [index, product] of SEED_PRODUCTS.entries()) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoria desconhecida no seed: ${product.categorySlug}`);
    }

    const [inserted] = await db
      .insert(products)
      .values({
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        descriptionMd: product.descriptionMd,
        categoryId,
        priceType: product.priceCents === null ? "on_request" : "fixed",
        priceCents: product.priceCents,
        status: product.status,
        isFeatured: product.isFeatured ?? false,
        position: index,
        allowsPersonalization: product.personalization !== undefined,
        personalizationLabel: product.personalization?.label ?? null,
        personalizationHelp: product.personalization?.help ?? null,
        variantGroupLabel: product.variantGroupLabel ?? null,
        seoTitle: `${product.name} — Oficina Rassë`,
        seoDescription: product.shortDescription,
      })
      .returning({ id: products.id });

    if (!inserted) {
      throw new Error(`Falhou a inserção do produto ${product.slug}.`);
    }

    await db.insert(productImages).values(
      product.images.map((image, position) => ({
        productId: inserted.id,
        r2Key: `seed/${image.file}`,
        alt: image.alt,
        width: IMAGEM_LARGURA,
        height: IMAGEM_ALTURA,
        position,
      })),
    );

    if (product.variants && product.variants.length > 0) {
      await db.insert(productVariants).values(
        product.variants.map((variant, position) => ({
          productId: inserted.id,
          name: variant.name,
          priceDeltaCents: variant.priceDeltaCents,
          position,
        })),
      );
    }
  }

  process.stdout.write(
    [
      `Seed concluído em ${new URL(url!).hostname}.`,
      `  categorias: ${insertedCategories.length}`,
      `  produtos:   ${SEED_PRODUCTS.length}`,
      "",
      "O seed não cria administradores. Usa `pnpm user:create`.",
      "",
    ].join("\n"),
  );
}

await main();
