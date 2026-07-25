import { z } from "zod";

/**
 * Uma chave presente mas vazia no `.env.local` (`NEXT_PUBLIC_SITE_URL=`) chega
 * aqui como string vazia, não como `undefined`. Para as opcionais, vazio é o
 * mesmo que ausente.
 */
const optionalUrl = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.url(message).optional(),
  );

const required = (name: string) =>
  z.string({ error: `${name} em falta. Ver .env.example.` }).min(1, `${name} está vazia.`);

const envSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL em falta. Copia .env.example para .env.local e preenche-a." })
    .min(1, "DATABASE_URL está vazia.")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL tem de ser uma connection string Postgres (Neon), a começar por postgres://.",
    ),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Cloudflare R2. Obrigatórias: sem elas não há upload de ficheiros.
  R2_ACCOUNT_ID: required("R2_ACCOUNT_ID"),
  R2_ACCESS_KEY_ID: required("R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: required("R2_SECRET_ACCESS_KEY"),
  R2_BUCKET: required("R2_BUCKET"),
  NEXT_PUBLIC_R2_PUBLIC_URL: optionalUrl(
    "NEXT_PUBLIC_R2_PUBLIC_URL tem de ser um URL completo, com protocolo.",
  ),

  // Cloudflare Turnstile. Obrigatórias: nunca há caminho que salte a verificação.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: required("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
  TURNSTILE_SECRET_KEY: required("TURNSTILE_SECRET_KEY"),

  // URL público do site, usado como metadataBase das metatags Open Graph.
  NEXT_PUBLIC_SITE_URL: optionalUrl(
    "NEXT_PUBLIC_SITE_URL tem de ser um URL completo, com protocolo.",
  ),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const detalhes = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(raiz)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${detalhes}`);
  }

  return parsed.data;
}

export const env = loadEnv();
