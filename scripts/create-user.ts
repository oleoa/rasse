import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

/**
 * Cria um administrador. Não há registro público — os usuários nascem todos
 * por aqui, como manda a seção 6 do CLAUDE.md.
 *
 *   pnpm user:create
 *   pnpm user:create -- --email=a@b.c --name="Nome"
 *
 * A senha é sempre pedida no stdin, para não ficar no histórico da shell nem
 * nas variáveis de ambiente.
 */

const ROUNDS = 12;
const MIN_SENHA = 10;

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL ausente. Rode com --env-file=.env.local.");

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
  const email = (argOf("email") ?? (await perguntar("E-mail: "))).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`E-mail inválido: ${email}`);
  }

  const [existente] = await sql`select id from users where email = ${email}`;
  if (existente) throw new Error(`Já existe um usuário com o e-mail .`);

  const name = (argOf("name") ?? (await perguntar("Nome: "))).trim();
  if (name.length < 2) throw new Error("O nome precisa ter pelo menos 2 caracteres.");

  const senha = await perguntar(`Senha (mín. ${MIN_SENHA} caracteres): `);
  if (senha.length < MIN_SENHA) {
    throw new Error(`A senha precisa ter pelo menos ${MIN_SENHA} caracteres.`);
  }

  if (senha !== (await perguntar("Repita a senha: "))) {
    throw new Error("As senhas não coincidem.");
  }

  const [criado] = await sql`
    insert into users (email, password_hash, name)
    values (${email}, ${await bcrypt.hash(senha, ROUNDS)}, ${name})
    returning email, name`;

  stdout.write(`\nUsuário criado: ${criado?.name} <${criado?.email}>\n`);
} finally {
  rl.close();
}
