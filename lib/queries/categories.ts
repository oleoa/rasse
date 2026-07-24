import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories, type Category } from "@/db/schema";

export async function getCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(asc(categories.position), asc(categories.name));
}
