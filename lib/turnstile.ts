import "server-only";

import { env } from "@/lib/env";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SiteverifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  challenge_ts?: string;
};

export type TurnstileResult = { ok: true } | { ok: false; reason: string };

/**
 * Não há caminho que salte esta verificação: se o token faltar ou a Cloudflare
 * recusar, quem chama recusa também. Os tokens são de uso único — cada chamada
 * ao servidor precisa de um token fresco.
 */
export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, reason: "Verificação anti-spam ausente." };
  }

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  let payload: SiteverifyResponse;

  try {
    const response = await fetch(SITEVERIFY, {
      method: "POST",
      body,
      // Não pode ficar pendurado a bloquear o pedido.
      signal: AbortSignal.timeout(8000),
    });
    payload = (await response.json()) as SiteverifyResponse;
  } catch {
    return {
      ok: false,
      reason: "Não foi possível validar a verificação anti-spam. Tente de novo.",
    };
  }

  if (payload.success) return { ok: true };

  const codes = payload["error-codes"] ?? [];

  // Configuração errada do nosso lado — vale a pena ficar no log do servidor.
  if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
    console.error("Turnstile mal configurado:", codes.join(", "));
    return { ok: false, reason: "A verificação anti-spam está mal configurada no servidor." };
  }

  if (codes.includes("timeout-or-duplicate")) {
    return { ok: false, reason: "A verificação expirou. Tente enviar de novo." };
  }

  return {
    ok: false,
    reason: "A verificação anti-spam falhou. Recarregue a página e tente de novo.",
  };
}
