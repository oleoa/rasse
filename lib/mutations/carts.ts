"use server";

import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cartItems, carts, events, products } from "@/db/schema";
import { generateUniqueCode } from "@/lib/code";
import { getSettings } from "@/lib/queries/settings";
import { buildWhatsappMessage, whatsappUrl, type WhatsappItem } from "@/lib/whatsapp";

const MAX_LINES = 50;

/**
 * O cliente manda apenas identificadores, quantidades e texto. Nome, preço e
 * disponibilidade vêm sempre do banco de dados — adulterar o localStorage não
 * altera nada do que é salvo.
 */
const inputSchema = z.object({
  customerName: z.string().trim().max(80).nullable(),
  sessionId: z.string().max(64),
  path: z.string().max(200),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        variantId: z.uuid().nullable(),
        quantity: z.int().min(1).max(99),
        personalizationText: z.string().trim().max(200).nullable(),
      }),
    )
    .min(1)
    .max(MAX_LINES),
});

export type CreateCartInput = z.input<typeof inputSchema>;

export type CreateCartResult =
  | {
      ok: true;
      code: string;
      whatsappUrl: string;
      message: string;
      /** Ids que não estavam mais publicados e ficaram de fora. */
      removedProductIds: string[];
      subtotalCents: number;
      hasOnRequestItems: boolean;
    }
  | { ok: false; error: string; removedProductIds?: string[] };

export async function createCartAndGetWhatsappUrl(raw: unknown): Promise<CreateCartResult> {
  const parsed = inputSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido. Recarregue a página e tente de novo." };
  }

  const input = parsed.data;

  const settings = await getSettings();
  if (!settings) {
    return { ok: false, error: "As configurações da oficina ainda não foram preenchidas." };
  }

  const productIds = [...new Set(input.items.map((item) => item.productId))];

  const rows = await db.query.products.findMany({
    where: inArray(products.id, productIds),
    with: { variants: true },
  });

  const available = new Map(rows.filter((row) => row.status === "published").map((r) => [r.id, r]));
  const removedProductIds = productIds.filter((id) => !available.has(id));

  type Prepared = {
    productId: string;
    productNameSnapshot: string;
    variantNameSnapshot: string | null;
    quantity: number;
    unitPriceCentsSnapshot: number | null;
    personalizationText: string | null;
  };

  const prepared: Prepared[] = [];

  for (const item of input.items) {
    const product = available.get(item.productId);
    if (!product) continue;

    const variant = item.variantId
      ? (product.variants.find((v) => v.id === item.variantId) ?? null)
      : null;

    // Variante que não existe mais: cai para o produto base em vez de quebrar.
    const unitPriceCents =
      product.priceType === "on_request" || product.priceCents === null
        ? null
        : product.priceCents + (variant?.priceDeltaCents ?? 0);

    prepared.push({
      productId: product.id,
      productNameSnapshot: product.name,
      variantNameSnapshot: variant?.name ?? null,
      quantity: item.quantity,
      unitPriceCentsSnapshot: unitPriceCents,
      personalizationText: product.allowsPersonalization ? item.personalizationText : null,
    });
  }

  if (prepared.length === 0) {
    return {
      ok: false,
      error: "Nenhuma das peças da cesta continua disponível.",
      removedProductIds,
    };
  }

  const subtotal = prepared.reduce(
    (total, line) => total + (line.unitPriceCentsSnapshot ?? 0) * line.quantity,
    0,
  );
  const hasOnRequestItems = prepared.some((line) => line.unitPriceCentsSnapshot === null);

  const code = await generateUniqueCode(async (candidate) => {
    const [row] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.code, candidate))
      .limit(1);
    return row !== undefined;
  });

  const [cart] = await db
    .insert(carts)
    .values({
      code,
      customerName: input.customerName && input.customerName.length > 0 ? input.customerName : null,
      subtotalCents: subtotal,
      hasOnRequestItems,
    })
    .returning({ id: carts.id });

  if (!cart) {
    return { ok: false, error: "Não foi possível registrar o pedido. Tente de novo." };
  }

  try {
    await db.insert(cartItems).values(prepared.map((line) => ({ ...line, cartId: cart.id })));
  } catch (error) {
    // Sem itens, a cesta não serve para nada — não deixar uma linha órfã.
    await db.delete(carts).where(eq(carts.id, cart.id));
    throw error;
  }

  const items: WhatsappItem[] = prepared.map((line) => ({
    quantity: line.quantity,
    name: line.productNameSnapshot,
    variantName: line.variantNameSnapshot,
    onRequest: line.unitPriceCentsSnapshot === null,
  }));

  const message = buildWhatsappMessage(items, code);

  await db
    .insert(events)
    .values({
      type: "cart_sent",
      sessionId: input.sessionId || "desconhecida",
      path: input.path,
    })
    .catch(() => {
      // Analytics nunca pode partir o fluxo que gera receita.
    });

  return {
    ok: true,
    code,
    whatsappUrl: whatsappUrl(settings.whatsappNumber, message),
    message,
    removedProductIds,
    subtotalCents: subtotal,
    hasOnRequestItems,
  };
}
