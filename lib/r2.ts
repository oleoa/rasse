import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

export const PRESIGN_EXPIRES_SECONDS = 300; // 5 minutos, como no PLAN.md
export const DOWNLOAD_EXPIRES_SECONDS = 900; // 15 minutos, para o dashboard

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const QUOTES_PREFIX = "quotes/";

/**
 * Dois buckets, e a chave decide qual.
 *
 * As imagens de produto têm de ser legíveis por qualquer pessoa — estão num
 * site público. Os ficheiros dos clientes não podem ser, e num bucket com
 * acesso público activado seriam, porque o acesso público é do bucket inteiro.
 * Daí `quotes/` viver num bucket separado, sem acesso público, onde a única
 * porta é um URL assinado.
 */
export function bucketForKey(key: string): string {
  return key.startsWith(QUOTES_PREFIX) ? env.R2_PRIVATE_BUCKET : env.R2_BUCKET;
}

export function isPrivateKey(key: string): boolean {
  return key.startsWith(QUOTES_PREFIX);
}

/** `quotes/{quote_code}/{uuid}.{ext}` — CLAUDE.md, secção 6. */
export function quoteFileKey(code: string, extension: string): string {
  return `${QUOTES_PREFIX}${code}/${crypto.randomUUID()}.${extension}`;
}

export function isQuoteKeyFor(code: string, key: string): boolean {
  return key.startsWith(`${QUOTES_PREFIX}${code}/`);
}

export function presignUpload(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: bucketForKey(key), Key: key, ContentType: contentType }),
    { expiresIn: PRESIGN_EXPIRES_SECONDS },
  );
}

export function presignDownload(key: string, filename?: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: bucketForKey(key),
      Key: key,
      ...(filename
        ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "")}"` }
        : {}),
    }),
    { expiresIn: DOWNLOAD_EXPIRES_SECONDS },
  );
}

export async function objectSize(key: string): Promise<number | null> {
  try {
    const head = await r2.send(new HeadObjectCommand({ Bucket: bucketForKey(key), Key: key }));
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

/** Lê só os primeiros bytes, para inspeccionar a assinatura do ficheiro. */
export async function readHead(key: string, bytes = 16): Promise<Uint8Array | null> {
  try {
    const result = await r2.send(
      new GetObjectCommand({ Bucket: bucketForKey(key), Key: key, Range: `bytes=0-${bytes - 1}` }),
    );
    const body = await result.Body?.transformToByteArray();
    return body ?? null;
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: bucketForKey(key), Key: key }));
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  // Agrupar por bucket, e a API aceita 1000 de cada vez.
  const porBucket = new Map<string, string[]>();
  for (const key of keys) {
    const bucket = bucketForKey(key);
    porBucket.set(bucket, [...(porBucket.get(bucket) ?? []), key]);
  }

  for (const [bucket, lista] of porBucket) {
    for (let i = 0; i < lista.length; i += 1000) {
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: lista.slice(i, i + 1000).map((Key) => ({ Key })) },
        }),
      );
    }
  }
}

export async function copyObject(
  from: { bucket: string; key: string },
  to: { bucket: string; key: string },
) {
  await r2.send(
    new CopyObjectCommand({
      Bucket: to.bucket,
      Key: to.key,
      CopySource: `${from.bucket}/${from.key}`,
    }),
  );
}

export type StoredObject = { key: string; lastModified: Date | null; size: number };

export async function listObjects(prefix: string, bucket?: string): Promise<StoredObject[]> {
  const alvo = bucket ?? bucketForKey(prefix);
  const objects: StoredObject[] = [];
  let token: string | undefined;

  do {
    const page = await r2.send(
      new ListObjectsV2Command({ Bucket: alvo, Prefix: prefix, ContinuationToken: token }),
    );

    for (const item of page.Contents ?? []) {
      if (!item.Key) continue;
      objects.push({
        key: item.Key,
        lastModified: item.LastModified ?? null,
        size: item.Size ?? 0,
      });
    }

    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  return objects;
}
