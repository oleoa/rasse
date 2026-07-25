import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { presignUpload } from "@/lib/r2";
import { extensionOf } from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Só imagens web, e com mime coerente — aqui não há formatos de CAD. */
const IMAGE_MIMES: Record<string, readonly string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  avif: ["image/avif"],
};

const bodySchema = z.object({
  productId: z.uuid(),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(255),
        mime: z.string().max(255),
        sizeBytes: z.int().positive(),
      }),
    )
    .min(1)
    .max(12),
});

/**
 * Assinaturas para imagens de produto. A porta aqui é a sessão do painel, não o
 * Turnstile: quem chega a este endpoint já é administrador.
 * Chaves em `products/{product_id}/{uuid}.{ext}` — CLAUDE.md, secção 7.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sem sessão." }, { status: 401 });
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

  const uploads = [];

  for (const file of parsed.data.files) {
    const ext = extensionOf(file.filename);
    const permitidos = IMAGE_MIMES[ext];
    const mime = file.mime.toLowerCase().split(";")[0]?.trim() ?? "";

    if (!permitidos) {
      return NextResponse.json(
        {
          error: `.${ext || "?"} não é uma imagem aceite. Usa ${Object.keys(IMAGE_MIMES).join(", ")}.`,
        },
        { status: 422 },
      );
    }
    if (!permitidos.includes(mime)) {
      return NextResponse.json(
        { error: `O tipo de "${file.filename}" não bate certo com .${ext}.` },
        { status: 422 },
      );
    }
    if (file.sizeBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_IMAGE_BYTES / 1024 / 1024} MB por imagem.` },
        { status: 422 },
      );
    }

    const key = `products/${parsed.data.productId}/${crypto.randomUUID()}.${ext}`;
    uploads.push({
      filename: file.filename,
      key,
      contentType: mime,
      url: await presignUpload(key, mime),
    });
  }

  return NextResponse.json({ uploads });
}
