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

const envSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL em falta. Copia .env.example para .env.local e preenche-a." })
    .min(1, "DATABASE_URL está vazia.")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL tem de ser uma connection string Postgres (Neon), a começar por postgres://.",
    ),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Domínio público do bucket R2. Sem ele, só existem as imagens locais de seed.
  NEXT_PUBLIC_R2_PUBLIC_URL: optionalUrl(
    "NEXT_PUBLIC_R2_PUBLIC_URL tem de ser um URL completo, com protocolo.",
  ),
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
