"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { events, quoteFiles, quoteRequests } from "@/db/schema";
import { generateUniqueCode, isValidCode } from "@/lib/code";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { deleteObjects, isQuoteKeyFor, objectSize, readHead } from "@/lib/r2";
import { getSettings } from "@/lib/queries/settings";
import { verifyTurnstile } from "@/lib/turnstile";
import { inspectFileHead, MAX_FILE_BYTES, MAX_FILES, validateFileMeta } from "@/lib/uploads";
import { whatsappUrl } from "@/lib/whatsapp";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_SECONDS = 60 * 60;

const inputSchema = z.object({
  name: z.string().trim().min(2, "Diga o seu nome.").max(80),
  contact: z.string().trim().min(5, "Deixe um WhatsApp ou e-mail.").max(120),
  message: z.string().trim().min(10, "Descreva a peça que você tem em mente.").max(4000),
  turnstileToken: z.string().min(1).max(2048),
  sessionId: z.string().max(64),
  /** Vem do presign. Vazio quando o pedido não leva arquivos. */
  code: z.string().max(20).nullable(),
  files: z
    .array(
      z.object({
        key: z.string().min(1).max(400),
        filename: z.string().min(1).max(255),
        mime: z.string().max(255),
        sizeBytes: z.int().positive(),
      }),
    )
    .max(MAX_FILES),
});

export type QuoteInput = z.input<typeof inputSchema>;

export type QuoteResult =
  { ok: true; code: string; whatsappUrl: string | null } | { ok: false; error: string };

export async function submitQuoteRequest(raw: unknown): Promise<QuoteResult> {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);

  const limite = await rateLimit(`orcamento:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_SECONDS);
  if (!limite.allowed) {
    return { ok: false, error: "Muitos pedidos deste endereço. Tente daqui a pouco." };
  }

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Pedido inválido." };
  }

  const input = parsed.data;

  const turnstile = await verifyTurnstile(input.turnstileToken, ip);
  if (!turnstile.ok) {
    return { ok: false, error: turnstile.reason };
  }

  // O código veio do presign; nunca é aceite como veio. Se não houver arquivos,
  // é gerado aqui de raiz.
  let code: string;

  if (input.files.length > 0) {
    if (!input.code || !isValidCode(input.code)) {
      return { ok: false, error: "Pedido inválido. Recarregue a página e tente de novo." };
    }

    const [existing] = await db
      .select({ id: quoteRequests.id })
      .from(quoteRequests)
      .where(eq(quoteRequests.code, input.code))
      .limit(1);

    if (existing) {
      return { ok: false, error: "Este pedido já foi enviado." };
    }

    // Cada chave precisa pertencer a este código — senão um cliente podia
    // apontar para arquivos de outro pedido.
    if (input.files.some((file) => !isQuoteKeyFor(input.code!, file.key))) {
      return { ok: false, error: "Pedido inválido. Recarregue a página e tente de novo." };
    }

    code = input.code;
  } else {
    code = await generateUniqueCode(async (candidate) => {
      const [row] = await db
        .select({ id: quoteRequests.id })
        .from(quoteRequests)
        .where(eq(quoteRequests.code, candidate))
        .limit(1);
      return row !== undefined;
    });
  }

  // Os arquivos já estão no bucket. Confirmar que existem, que o tamanho
  // declarado bate certo, e que o conteúdo é mesmo do formato indicado.
  const verified: Array<{ key: string; filename: string; mime: string; sizeBytes: number }> = [];

  for (const file of input.files) {
    const rejection = validateFileMeta(file);
    if (rejection) {
      await deleteObjects(input.files.map((f) => f.key));
      return { ok: false, error: rejection.reason };
    }

    const size = await objectSize(file.key);
    if (size === null) {
      return { ok: false, error: `O arquivo "${file.filename}" não chegou ao servidor.` };
    }
    if (size > MAX_FILE_BYTES) {
      await deleteObjects(input.files.map((f) => f.key));
      return { ok: false, error: `"${file.filename}" passa do limite de tamanho.` };
    }

    const head = await readHead(file.key);
    const contentRejection = head ? inspectFileHead(file.filename, head) : null;
    if (contentRejection) {
      await deleteObjects(input.files.map((f) => f.key));
      return { ok: false, error: contentRejection.reason };
    }

    verified.push({ ...file, sizeBytes: size });
  }

  const [quote] = await db
    .insert(quoteRequests)
    .values({
      code,
      name: input.name,
      contact: input.contact,
      message: input.message,
    })
    .returning({ id: quoteRequests.id });

  if (!quote) {
    return { ok: false, error: "Não foi possível registrar o pedido. Tente de novo." };
  }

  if (verified.length > 0) {
    try {
      await db.insert(quoteFiles).values(
        verified.map((file) => ({
          quoteRequestId: quote.id,
          r2Key: file.key,
          filename: file.filename,
          mime: file.mime || "application/octet-stream",
          sizeBytes: file.sizeBytes,
        })),
      );
    } catch (error) {
      await db.delete(quoteRequests).where(eq(quoteRequests.id, quote.id));
      throw error;
    }
  }

  await db
    .insert(events)
    .values({
      type: "quote_submitted",
      sessionId: input.sessionId || "desconhecida",
      path: "/personalizado",
    })
    .catch(() => {
      // Analytics nunca parte o fluxo.
    });

  const settings = await getSettings();
  const mensagem = [
    "Olá! Acabei de enviar um pedido de peça personalizada.",
    "",
    `Código do pedido: ${code}`,
  ].join("\n");

  return {
    ok: true,
    code,
    whatsappUrl: settings ? whatsappUrl(settings.whatsappNumber, mensagem) : null,
  };
}
