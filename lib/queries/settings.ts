import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, type Settings } from "@/db/schema";

export async function getSettings(): Promise<Settings | null> {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  return row ?? null;
}
