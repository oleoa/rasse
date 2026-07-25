import "server-only";

import {
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
export const DOWNLOAD_EXPIRES_SECONDS = 900; // 15 minutos, para o dashboard da Fase 8

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET;

/** `quotes/{quote_code}/{uuid}.{ext}` — CLAUDE.md, secção 6. */
export function quoteFileKey(code: string, extension: string): string {
  return `quotes/${code}/${crypto.randomUUID()}.${extension}`;
}

export function isQuoteKeyFor(code: string, key: string): boolean {
  return key.startsWith(`quotes/${code}/`);
}

export function presignUpload(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: PRESIGN_EXPIRES_SECONDS },
  );
}

export function presignDownload(key: string, filename?: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
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
    const head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

/** Lê só os primeiros bytes, para inspeccionar a assinatura do ficheiro. */
export async function readHead(key: string, bytes = 16): Promise<Uint8Array | null> {
  try {
    const result = await r2.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key, Range: `bytes=0-${bytes - 1}` }),
    );
    const body = await result.Body?.transformToByteArray();
    return body ?? null;
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  // A API aceita 1000 de cada vez.
  for (let i = 0; i < keys.length; i += 1000) {
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) },
      }),
    );
  }
}

export type StoredObject = { key: string; lastModified: Date | null; size: number };

export async function listObjects(prefix: string): Promise<StoredObject[]> {
  const objects: StoredObject[] = [];
  let token: string | undefined;

  do {
    const page = await r2.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }),
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
