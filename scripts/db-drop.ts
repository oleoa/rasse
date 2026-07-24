import { neon } from "@neondatabase/serverless";

if (process.env.NODE_ENV === "production") {
  throw new Error("db-drop recusa correr com NODE_ENV=production.");
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL em falta. Corre com --env-file=.env.local.");
}

const sql = neon(url);

await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql`DROP SCHEMA IF EXISTS public CASCADE`;
await sql`CREATE SCHEMA public`;

process.stdout.write(`Schema public recriado em ${new URL(url).hostname}.\n`);
