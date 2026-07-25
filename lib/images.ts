/**
 * As chaves com o prefixo `seed/` são os placeholders locais em `public/seed/`,
 * criados na Fase 1. Todas as outras são objetos do R2 e resolvem contra
 * `NEXT_PUBLIC_R2_PUBLIC_URL`. Sem essa variável, a função devolve uma string
 * vazia e quem chama trata a ausência de imagem.
 *
 * O prefixo `NEXT_PUBLIC_` é obrigatório: isto também corre no browser, nas
 * linhas da cesta. Sem ele, o valor seria `undefined` do lado do cliente.
 */
const SEED_PREFIX = "seed/";

export function imageUrl(r2Key: string): string {
  if (r2Key.startsWith(SEED_PREFIX)) return `/${r2Key}`;

  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) return "";

  return `${base.replace(/\/$/, "")}/${r2Key}`;
}

/** O optimizador do Next recusa SVG sem `dangerouslyAllowSVG`; os placeholders passam ao lado. */
export function isUnoptimized(r2Key: string): boolean {
  return r2Key.endsWith(".svg");
}
