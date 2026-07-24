/**
 * As chaves com o prefixo `seed/` são os placeholders locais em `public/seed/`,
 * criados na Fase 1. Todas as outras são objetos do R2 e resolvem contra
 * R2_PUBLIC_URL. Enquanto o bucket não existir, a chave devolve uma string vazia
 * e quem chama trata a ausência de imagem.
 */
const SEED_PREFIX = "seed/";

export function imageUrl(r2Key: string): string {
  if (r2Key.startsWith(SEED_PREFIX)) return `/${r2Key}`;

  const base = process.env.R2_PUBLIC_URL;
  if (!base) return "";

  return `${base.replace(/\/$/, "")}/${r2Key}`;
}

/** O optimizador do Next recusa SVG sem `dangerouslyAllowSVG`; os placeholders passam ao lado. */
export function isUnoptimized(r2Key: string): boolean {
  return r2Key.endsWith(".svg");
}
