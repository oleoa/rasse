import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Token de pré-visualização de rascunhos: um HMAC do id do produto, assinado
 * com o `AUTH_SECRET`. Não expira e não precisa de estado — quem tiver o link
 * vê o rascunho, e quem não tiver não consegue forjá-lo.
 */
export function previewToken(productId: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(`preview:${productId}`).digest("base64url");
}

export function isValidPreviewToken(productId: string, token: string | undefined): boolean {
  if (!token) return false;

  const esperado = Buffer.from(previewToken(productId));
  const recebido = Buffer.from(token);

  // Comprimentos diferentes: `timingSafeEqual` lança em vez de retornar false.
  if (esperado.length !== recebido.length) return false;

  return timingSafeEqual(esperado, recebido);
}
