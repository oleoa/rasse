import { neon } from "@neondatabase/serverless";

/**
 * Apaga o schema `public` inteiro. Só para desenvolvimento.
 *
 * O guard não é `NODE_ENV=production` — essa variável nunca está definida quando
 * se roda um script à mão, por isso não protege de nada. O que protege é olhar
 * para o conteúdo: um banco de dados só com o seed não tem usuários, pedidos
 * nem orçamentos. Se tiver, é porque alguém a usou a sério, e o script recusa.
 *
 *   pnpm db:reset            recusa se houver dados reais
 *   pnpm db:reset --force    apaga na mesma
 */

const FORCE = process.argv.includes("--force");

if (process.env.NODE_ENV === "production") {
  throw new Error("db-drop se recusa a rodar com NODE_ENV=production.");
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL ausente. Rode com --env-file=.env.local.");
}

const sql = neon(url);
const host = new URL(url).hostname;

/** Tabelas cujo conteúdo nunca vem do seed. */
async function dadosReais(): Promise<Record<string, number>> {
  const contagens: Record<string, number> = {};

  const consultas = {
    users: () => sql`select count(*)::int as n from users`,
    carts: () => sql`select count(*)::int as n from carts`,
    quote_requests: () => sql`select count(*)::int as n from quote_requests`,
  };

  for (const [tabela, consulta] of Object.entries(consultas)) {
    try {
      const [linha] = await consulta();
      const n = Number(linha?.n ?? 0);
      if (n > 0) contagens[tabela] = n;
    } catch {
      // A tabela ainda não existe: banco de dados vazio, nada a proteger.
    }
  }

  return contagens;
}

const encontrados = await dadosReais();

if (Object.keys(encontrados).length > 0 && !FORCE) {
  const resumo = Object.entries(encontrados)
    .map(([tabela, n]) => `    ${tabela}: ${n}`)
    .join("\n");

  throw new Error(
    [
      "",
      `  RECUSADO. O banco de dados em ${host} tem dados que o seed não cria:`,
      "",
      resumo,
      "",
      "  Isto parece um banco de dados em uso, não um de desenvolvimento limpo.",
      "  Apagar o schema levaria junto usuários, pedidos e orçamentos.",
      "",
      "  Se é isso mesmo que você quer: pnpm db:reset --force",
      "",
    ].join("\n"),
  );
}

await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql`DROP SCHEMA IF EXISTS public CASCADE`;
await sql`CREATE SCHEMA public`;

process.stdout.write(`Schema public recriado em ${host}.\n`);
