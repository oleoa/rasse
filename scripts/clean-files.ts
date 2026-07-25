import { neon } from "@neondatabase/serverless";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

/**
 * Duas limpezas, ambas exigidas pela Fase 5 e pela Fase 10:
 *
 *  1. Ficheiros órfãos — subiram para o bucket mas o formulário nunca foi
 *     submetido, por isso não existe `quote_requests` com aquele código.
 *     Só apaga acima de 24h, para não apanhar um upload em curso.
 *  2. Retenção de 12 meses — pedidos mais antigos do que isso perdem os
 *     ficheiros. A linha do pedido fica, para histórico.
 *
 * Corre com: pnpm files:clean          (mostra o que faria)
 *            pnpm files:clean --apply  (apaga mesmo)
 */

const APPLY = process.argv.includes("--apply");
/** Configurável só para poder ser testado; em produção fica nas 24h. */
const ORPHAN_AFTER_HOURS = Number(process.env.ORPHAN_AFTER_HOURS ?? 24);
const RETENTION_MONTHS = Number(process.env.RETENTION_MONTHS ?? 12);

const { DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
  process.env as Record<string, string>;

if (!DATABASE_URL || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  throw new Error("Faltam variáveis de ambiente. Corre com --env-file=.env.local.");
}

const sql = neon(DATABASE_URL);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function listAll(prefix: string) {
  const objects: Array<{ key: string; lastModified: Date }> = [];
  let token: string | undefined;

  do {
    const page = await s3.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix, ContinuationToken: token }),
    );
    for (const item of page.Contents ?? []) {
      if (item.Key) objects.push({ key: item.Key, lastModified: item.LastModified ?? new Date(0) });
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  return objects;
}

async function remove(keys: string[]) {
  if (keys.length === 0 || !APPLY) return;
  for (let i = 0; i < keys.length; i += 1000) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) },
      }),
    );
  }
}

const objects = await listAll("quotes/");
const codigosConhecidos = new Set(
  (await sql`select code from quote_requests`).map((row) => row.code as string),
);
const antigos = new Set(
  (
    await sql`select code from quote_requests where created_at < now() - make_interval(months => ${RETENTION_MONTHS})`
  ).map((row) => row.code as string),
);

const limite = Date.now() - ORPHAN_AFTER_HOURS * 60 * 60 * 1000;
const orfaos: string[] = [];
const expirados: string[] = [];

for (const object of objects) {
  const code = object.key.split("/")[1];
  if (!code) continue;

  if (!codigosConhecidos.has(code)) {
    if (object.lastModified.getTime() < limite) orfaos.push(object.key);
    continue;
  }

  if (antigos.has(code)) expirados.push(object.key);
}

console.log(`Objectos em quotes/: ${objects.length}`);
console.log(`  órfãos com mais de ${ORPHAN_AFTER_HOURS}h: ${orfaos.length}`);
console.log(`  fora da retenção de ${RETENTION_MONTHS} meses: ${expirados.length}`);

await remove(orfaos);
await remove(expirados);

if (APPLY && expirados.length > 0) {
  await sql`delete from quote_files where r2_key = any(${expirados})`;
}

// Contadores de rate limit já sem uso.
const purgados = APPLY
  ? await sql`delete from rate_limits where window_start < now() - interval '24 hours' returning key`
  : await sql`select key from rate_limits where window_start < now() - interval '24 hours'`;
console.log(`  contadores de rate limit expirados: ${purgados.length}`);

console.log(APPLY ? "Apagado." : "Simulação. Corre com --apply para apagar.");
