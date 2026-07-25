import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
};

/**
 * Contador por janela deslizante, atómico num único INSERT ... ON CONFLICT.
 *
 * Vive na base de dados e não em memória: na Vercel cada invocação pode cair
 * numa instância diferente, e um `Map` local não travaria nada.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const result = await db.execute(sql`
    insert into rate_limits (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      count = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        then 1
        else rate_limits.count + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        then now()
        else rate_limits.window_start
      end
    returning count, extract(epoch from (window_start + make_interval(secs => ${windowSeconds}) - now()))::int as retry_after
  `);

  const rows = (Array.isArray(result) ? result : result.rows) as Array<{
    count: number;
    retry_after: number;
  }>;

  const row = rows[0];
  const count = Number(row?.count ?? 1);
  const retryAfter = Math.max(0, Number(row?.retry_after ?? windowSeconds));

  return { allowed: count <= limit, count, limit, retryAfterSeconds: retryAfter };
}

/** Identidade do cliente atrás do proxy da Vercel. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || "desconhecido";
}
