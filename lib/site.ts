/**
 * URL público do site, para `metadataBase` e para os URLs absolutos do JSON-LD.
 *
 * `||` e não `??`: uma chave presente mas vazia no `.env.local` chega como
 * string vazia, e `new URL("")` rebenta.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
