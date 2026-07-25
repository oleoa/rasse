/**
 * URL pública do site, para `metadataBase` e para as URLs absolutas do JSON-LD.
 *
 * `||` e não `??`: uma chave presente mas vazia no `.env.local` chega como
 * string vazia, e `new URL("")` quebra.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
