import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL em falta. Copia .env.example para .env.local e preenche-a.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
