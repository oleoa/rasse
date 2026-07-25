"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cartItems, productImages, productVariants, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { deleteObjects } from "@/lib/r2";
import { imagesSchema, productSchema, variantsSchema } from "@/lib/validation/product";

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; field?: string };

async function exigirSessao(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user);
}

/** Todas as rotas públicas que dependem de produtos. */
function revalidarPublico(slug?: string, slugAntigo?: string) {
  revalidatePath("/");
  revalidatePath("/produtos");
  if (slug) revalidatePath(`/produtos/${slug}`);
  if (slugAntigo && slugAntigo !== slug) revalidatePath(`/produtos/${slugAntigo}`);
  revalidatePath("/dashboard/produtos");
}

const saveSchema = z.object({
  id: z.uuid().nullable(),
  product: productSchema,
  variants: variantsSchema,
  images: imagesSchema,
});

export async function saveProduct(raw: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entra de novo." };

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos.",
      field: issue?.path.filter((p) => typeof p === "string").join("."),
    };
  }

  const { id, product, variants, images } = parsed.data;

  // Slug único, verificado antes de gravar para dar erro no campo em vez de
  // deixar rebentar a constraint da base de dados.
  const [duplicado] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      id
        ? and(eq(products.slug, product.slug), ne(products.id, id))
        : eq(products.slug, product.slug),
    )
    .limit(1);

  if (duplicado) {
    return { ok: false, error: "Já existe um produto com este endereço.", field: "slug" };
  }

  const valores = {
    ...product,
    priceCents: product.priceType === "on_request" ? null : product.priceCents,
    personalizationLabel: product.allowsPersonalization ? product.personalizationLabel : null,
    personalizationHelp: product.allowsPersonalization ? product.personalizationHelp : null,
    variantGroupLabel: variants.length > 0 ? product.variantGroupLabel : null,
    updatedAt: new Date(),
  };

  let productId = id;
  let slugAntigo: string | undefined;

  if (id) {
    const [antigo] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!antigo) return { ok: false, error: "Este produto já não existe." };
    slugAntigo = antigo.slug;
    await db.update(products).set(valores).where(eq(products.id, id));
  } else {
    const [criado] = await db.insert(products).values(valores).returning({ id: products.id });
    if (!criado) return { ok: false, error: "Não foi possível criar o produto." };
    productId = criado.id;
  }

  if (!productId) return { ok: false, error: "Não foi possível gravar o produto." };

  await sincronizarVariantes(productId, variants);
  await sincronizarImagens(productId, images);

  revalidarPublico(product.slug, slugAntigo);
  return { ok: true, data: { id: productId } };
}

async function sincronizarVariantes(
  productId: string,
  variants: z.infer<typeof variantsSchema>,
): Promise<void> {
  const mantidas = variants.map((v) => v.id).filter((v): v is string => v !== null);

  await db
    .delete(productVariants)
    .where(
      mantidas.length > 0
        ? and(
            eq(productVariants.productId, productId),
            sql`${productVariants.id} <> all(${mantidas})`,
          )
        : eq(productVariants.productId, productId),
    );

  for (const [position, variante] of variants.entries()) {
    if (variante.id) {
      await db
        .update(productVariants)
        .set({ name: variante.name, priceDeltaCents: variante.priceDeltaCents, position })
        .where(eq(productVariants.id, variante.id));
    } else {
      await db.insert(productVariants).values({
        productId,
        name: variante.name,
        priceDeltaCents: variante.priceDeltaCents,
        position,
      });
    }
  }
}

async function sincronizarImagens(
  productId: string,
  images: z.infer<typeof imagesSchema>,
): Promise<void> {
  const mantidas = images.map((i) => i.id).filter((v): v is string => v !== null);

  // As que saíram da lista têm de desaparecer também do R2.
  const removidas = await db
    .select({ r2Key: productImages.r2Key })
    .from(productImages)
    .where(
      mantidas.length > 0
        ? and(eq(productImages.productId, productId), sql`${productImages.id} <> all(${mantidas})`)
        : eq(productImages.productId, productId),
    );

  if (removidas.length > 0) {
    await db
      .delete(productImages)
      .where(
        mantidas.length > 0
          ? and(
              eq(productImages.productId, productId),
              sql`${productImages.id} <> all(${mantidas})`,
            )
          : eq(productImages.productId, productId),
      );
    await deleteObjects(removidas.map((r) => r.r2Key)).catch(() => {
      // O objecto pode já não existir; a linha é que não podia ficar.
    });
  }

  for (const [position, imagem] of images.entries()) {
    if (imagem.id) {
      await db
        .update(productImages)
        .set({ alt: imagem.alt, position })
        .where(eq(productImages.id, imagem.id));
    } else {
      await db.insert(productImages).values({
        productId,
        r2Key: imagem.r2Key,
        alt: imagem.alt,
        width: imagem.width,
        height: imagem.height,
        position,
      });
    }
  }
}

const bulkSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
  action: z.enum(["publish", "archive", "draft"]),
});

export async function bulkUpdateStatus(raw: unknown): Promise<ActionResult<{ afetados: number }>> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entra de novo." };

  const parsed = bulkSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };

  const status =
    parsed.data.action === "publish"
      ? "published"
      : parsed.data.action === "archive"
        ? "archived"
        : "draft";

  const atualizados = await db
    .update(products)
    .set({ status, updatedAt: new Date() })
    .where(inArray(products.id, parsed.data.ids))
    .returning({ slug: products.slug });

  for (const p of atualizados) revalidatePath(`/produtos/${p.slug}`);
  revalidarPublico();

  return { ok: true, data: { afetados: atualizados.length } };
}

/**
 * Apagar só existe para rascunhos sem pedidos associados — CLAUDE.md, secção 5.
 * Tudo o resto arquiva-se.
 */
export async function deleteProduct(raw: unknown): Promise<ActionResult> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entra de novo." };

  const id = z.uuid().safeParse(raw);
  if (!id.success) return { ok: false, error: "Pedido inválido." };

  const [produto] = await db
    .select({ status: products.status, slug: products.slug })
    .from(products)
    .where(eq(products.id, id.data))
    .limit(1);

  if (!produto) return { ok: false, error: "Este produto já não existe." };

  if (produto.status !== "draft") {
    return { ok: false, error: "Só rascunhos podem ser apagados. Arquiva o produto." };
  }

  const [comPedido] = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(eq(cartItems.productId, id.data))
    .limit(1);

  if (comPedido) {
    return { ok: false, error: "Este produto já apareceu num pedido. Arquiva-o em vez de apagar." };
  }

  const imagens = await db
    .select({ r2Key: productImages.r2Key })
    .from(productImages)
    .where(eq(productImages.productId, id.data));

  await db.delete(products).where(eq(products.id, id.data));
  await deleteObjects(imagens.map((i) => i.r2Key)).catch(() => {});

  revalidarPublico(produto.slug);
  return { ok: true, data: undefined };
}
