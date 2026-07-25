"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_SECONDS = 15 * 60;

const schema = z.object({
  email: z.string().trim().min(1, "Preenche o email.").max(200),
  password: z.string().min(1, "Preenche a password.").max(200),
});

/** Só destinos internos do painel — senão o `callbackUrl` era um redirect aberto. */
function safeCallback(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  if (raw.startsWith("/dashboard") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export async function authenticate(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Preenche os dois campos.";
  }

  const ip = clientIp(await headers());
  const limite = await rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_SECONDS);
  if (!limite.allowed) {
    return "Demasiadas tentativas. Espera uns minutos.";
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (error) {
    // A mesma mensagem para "não existe" e para "password errada".
    if (error instanceof AuthError) return "Email ou password inválidos.";
    // O redirect de sucesso também passa por aqui, como exceção. Não apanhar.
    throw error;
  }

  return null;
}
