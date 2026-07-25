import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

/**
 * Cria um administrador. Não há registo público — os utilizadores nascem todos
 * por aqui, como manda a secção 6 do CLAUDE.md.
 *
 *   pnpm user:create
 *   pnpm user:create -- --email=a@b.c --name="Nome"
 *
 * A password é sempre pedida no stdin, para não ficar no histórico da shell nem
 * nas variáveis de ambiente.
 */

const ROUNDS = 12;
const MIN_PASSWORD = 10;

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL em falta. Corre com --env-file=.env.local.");

const sql = neon(DATABASE_URL);

// Iterador de linhas em vez de `question()`: assim funciona tanto no terminal
// como com o stdin vindo de um pipe, que fecha assim que os dados acabam.
const rl = createInterface({ input: stdin, terminal: false });
const linhas = rl[Symbol.asyncIterator]();

async function perguntar(etiqueta: string): Promise<string> {
  if (stdin.isTTY) stdout.write(etiqueta);
  const { value, done } = await linhas.next();
  if (done || value === undefined) throw new Error(`Falta a resposta a "${etiqueta.trim()}".`);
  return value.trim();
}

function argOf(name: string): string | undefined {
  const prefixo = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefixo))?.slice(prefixo.length);
}

try {
  const email = (argOf("email") ?? (await perguntar("Email: "))).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Email inválido: ${email}`);
  }

  const [existente] = await sql`select id from users where email = ${email}`;
  if (existente) throw new Error(`Já existe um utilizador com o email ${email}.`);

  const name = (argOf("name") ?? (await perguntar("Nome: "))).trim();
  if (name.length < 2) throw new Error("O nome tem de ter pelo menos 2 caracteres.");

  const password = await perguntar(`Password (mín. ${MIN_PASSWORD} caracteres): `);
  if (password.length < MIN_PASSWORD) {
    throw new Error(`A password tem de ter pelo menos ${MIN_PASSWORD} caracteres.`);
  }

  if (password !== (await perguntar("Repete a password: "))) {
    throw new Error("As passwords não coincidem.");
  }

  const [criado] = await sql`
    insert into users (email, password_hash, name)
    values (${email}, ${await bcrypt.hash(password, ROUNDS)}, ${name})
    returning email, name`;

  stdout.write(`\nUtilizador criado: ${criado?.name} <${criado?.email}>\n`);
} finally {
  rl.close();
}
