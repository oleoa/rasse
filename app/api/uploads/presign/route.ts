import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { quoteRequests } from "@/db/schema";
import { generateUniqueCode } from "@/lib/code";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { presignUpload, quoteFileKey } from "@/lib/r2";
import { verifyTurnstile } from "@/lib/turnstile";
import { extensionOf, MAX_FILES, validateFileMeta } from "@/lib/uploads";

export const runtime = "nodejs";

const PRESIGN_LIMIT = 5;
const PRESIGN_WINDOW_SECONDS = 10 * 60;

const bodySchema = z.object({
  turnstileToken: z.string().min(1).max(2048),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(255),
        mime: z.string().max(255),
        sizeBytes: z.int().positive(),
      }),
    )
    .min(1)
    .max(MAX_FILES),
});

/**
 * Assina os URLs de upload de um pedido inteiro numa só chamada.
 *
 * Um token do Turnstile é de uso único, por isso não daria para assinar arquivo
 * a arquivo. O código do pedido é gerado aqui, para as chaves ficarem no
 * formato `quotes/{quote_code}/{uuid}.{ext}` do CLAUDE.md; a linha em
 * `quote_requests` só nasce na submissão do formulário.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  const limite = await rateLimit(`presign:${ip}`, PRESIGN_LIMIT, PRESIGN_WINDOW_SECONDS);
  if (!limite.allowed) {
    return NextResponse.json(
      { error: "Muitos pedidos. Tente daqui a pouco." },
      { status: 429, headers: { "retry-after": String(limite.retryAfterSeconds) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const turnstile = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.reason }, { status: 403 });
  }

  // Extensão e mime, antes de assinar seja o que for.
  for (const file of parsed.data.files) {
    const rejection = validateFileMeta(file);
    if (rejection) {
      return NextResponse.json({ error: rejection.reason }, { status: 422 });
    }
  }

  const code = await generateUniqueCode(async (candidate) => {
    const [row] = await db
      .select({ id: quoteRequests.id })
      .from(quoteRequests)
      .where(eq(quoteRequests.code, candidate))
      .limit(1);
    return row !== undefined;
  });

  const uploads = await Promise.all(
    parsed.data.files.map(async (file) => {
      const key = quoteFileKey(code, extensionOf(file.filename));
      const contentType = file.mime || "application/octet-stream";
      return {
        filename: file.filename,
        key,
        contentType,
        url: await presignUpload(key, contentType),
      };
    }),
  );

  return NextResponse.json({ code, uploads });
}
