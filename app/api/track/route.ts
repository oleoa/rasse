import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { events } from "@/db/schema";
import { auth } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TRACK_LIMIT = 120;
const TRACK_WINDOW_SECONDS = 60;

const bodySchema = z.object({
  type: z.enum(["page_view", "product_view", "add_to_cart"]),
  productId: z.uuid().nullable().optional(),
  sessionId: z.string().min(1).max(64),
  path: z.string().min(1).max(200),
  referrer: z.string().max(400).nullable().optional(),
});

/** Bots óbvios. Não vale a pena ser exaustivo — só tirar o ruído maior. */
const BOT =
  /bot|crawler|spider|crawling|headless|preview|scan|curl|wget|python-requests|facebookexternalhit|slackbot|whatsapp/i;

/**
 * Ingestão de eventos, sem cookies. O `sessionId` é um uuid do `sessionStorage`.
 *
 * `cart_sent` e `quote_submitted` não entram por aqui: são salvos pelas
 * Server Actions que os originam, onde não há como falsificá-los.
 */
export async function POST(request: Request) {
  // Tráfego autenticado é o dono a mexer no painel — não conta como visita.
  const session = await auth();
  if (session?.user) return new NextResponse(null, { status: 204 });

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT.test(userAgent)) return new NextResponse(null, { status: 204 });

  const ip = clientIp(request.headers);
  const limite = await rateLimit(`track:${ip}`, TRACK_LIMIT, TRACK_WINDOW_SECONDS);
  if (!limite.allowed) return new NextResponse(null, { status: 429 });

  let raw: unknown;
  try {
    // `sendBeacon` manda text/plain; não dá para confiar no content-type.
    raw = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  try {
    await db.insert(events).values({
      type: parsed.data.type,
      productId: parsed.data.productId ?? null,
      sessionId: parsed.data.sessionId,
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? null,
    });
  } catch {
    // Um produto apagado entretanto não pode fazer o beacon falhar.
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}
