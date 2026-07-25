"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation/product";
import type { ActionResult } from "@/lib/mutations/products";

export async function saveSettings(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos.",
      field: issue?.path.filter((p) => typeof p === "string").join("."),
    };
  }

  // Singleton com id = 1; a linha nasce no seed, mas criamos se faltar.
  const [existente] = await db
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  if (existente) {
    await db
      .update(settings)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(settings.id, 1));
  } else {
    await db.insert(settings).values({ id: 1, ...parsed.data });
  }

  revalidatePath("/");
  revalidatePath("/quem-somos");
  revalidatePath("/produtos");
  revalidatePath("/cesta");
  revalidatePath("/dashboard/configuracoes");

  return { ok: true, data: undefined };
}
