"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { carts, quoteFiles, quoteRequests } from "@/db/schema";
import { auth } from "@/lib/auth";
import { presignDownload } from "@/lib/r2";
import type { ActionResult } from "@/lib/mutations/products";

const statusSchema = z.enum(["novo", "contactado", "fechado", "perdido"]);

const updateSchema = z.object({
  tipo: z.enum(["pedido", "orcamento"]),
  code: z.string().min(1).max(20),
  status: statusSchema.optional(),
  internalNotes: z.string().max(4000).nullable().optional(),
});

async function exigirSessao(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user);
}

/** Muda o estado e/ou as notas internas. As notas gravam-se sozinhas, com debounce no cliente. */
export async function updateRequest(raw: unknown): Promise<ActionResult> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entra de novo." };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };

  const { tipo, code, status, internalNotes } = parsed.data;

  const mudancas: {
    status?: z.infer<typeof statusSchema>;
    internalNotes?: string | null;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };
  if (status) mudancas.status = status;
  if (internalNotes !== undefined) mudancas.internalNotes = internalNotes;

  if (tipo === "pedido") {
    await db.update(carts).set(mudancas).where(eq(carts.code, code));
    revalidatePath("/dashboard/pedidos");
    revalidatePath(`/dashboard/pedidos/${code}`);
  } else {
    await db.update(quoteRequests).set(mudancas).where(eq(quoteRequests.code, code));
    revalidatePath("/dashboard/orcamentos");
    revalidatePath(`/dashboard/orcamentos/${code}`);
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

const downloadSchema = z.object({ code: z.string().min(1).max(20), fileId: z.uuid() });

/**
 * URL assinado de 15 minutos para descarregar um ficheiro de orçamento.
 *
 * Exige sessão: sem ela não há URL nenhum, e as chaves do R2 nunca chegam ao
 * browser de quem não está autenticado.
 */
export async function getQuoteFileUrl(raw: unknown): Promise<ActionResult<{ url: string }>> {
  if (!(await exigirSessao())) return { ok: false, error: "Sessão expirada. Entra de novo." };

  const parsed = downloadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };

  const [ficheiro] = await db
    .select({ r2Key: quoteFiles.r2Key, filename: quoteFiles.filename })
    .from(quoteFiles)
    .innerJoin(quoteRequests, eq(quoteFiles.quoteRequestId, quoteRequests.id))
    .where(and(eq(quoteFiles.id, parsed.data.fileId), eq(quoteRequests.code, parsed.data.code)))
    .limit(1);

  if (!ficheiro) return { ok: false, error: "Ficheiro não encontrado." };

  return { ok: true, data: { url: await presignDownload(ficheiro.r2Key, ficheiro.filename) } };
}
