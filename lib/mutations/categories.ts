"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { categorySchema } from "@/lib/validation/product";
import type { ActionResult } from "@/lib/mutations/products";

async function exigirSessao(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user);
}

function revalidar() {
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/dashboard/categorias");
  revalidatePath("/dashboard/produtos");
}

const saveSchema = z.object({ id: z.uuid().nullable(), category: categorySchema });

export async function saveCategory(raw: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos.",
      field: issue?.path.filter((p) => typeof p === "string").join("."),
    };
  }

  const { id, category } = parsed.data;

  const [duplicado] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      id
        ? and(eq(categories.slug, category.slug), ne(categories.id, id))
        : eq(categories.slug, category.slug),
    )
    .limit(1);

  if (duplicado) {
    return { ok: false, error: "Já existe uma categoria com este endereço.", field: "slug" };
  }

  if (id) {
    await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id));
    revalidar();
    return { ok: true, data: { id } };
  }

  const [criada] = await db.insert(categories).values(category).returning({ id: categories.id });
  if (!criada) return { ok: false, error: "Não foi possível criar a categoria." };

  revalidar();
  return { ok: true, data: { id: criada.id } };
}

/** Uma categoria com produtos não pode ser apagada — a FK também o impede. */
export async function deleteCategory(raw: unknown): Promise<ActionResult> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const id = z.uuid().safeParse(raw);
  if (!id.success) return { ok: false, error: "Pedido inválido." };

  const [{ value } = { value: 0 }] = await db
    .select({ value: count() })
    .from(products)
    .where(eq(products.categoryId, id.data));

  if (Number(value) > 0) {
    return {
      ok: false,
      error: `Esta categoria tem ${value} produto${Number(value) === 1 ? "" : "s"}. Mova-os primeiro.`,
    };
  }

  await db.delete(categories).where(eq(categories.id, id.data));
  revalidar();
  return { ok: true, data: undefined };
}

const reorderSchema = z.array(z.uuid()).min(1).max(200);

export async function reorderCategories(raw: unknown): Promise<ActionResult> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const parsed = reorderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };

  for (const [position, id] of parsed.data.entries()) {
    await db
      .update(categories)
      .set({ position, updatedAt: new Date() })
      .where(eq(categories.id, id));
  }

  revalidar();
  return { ok: true, data: undefined };
}
