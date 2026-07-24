# Oficina Rassë

Website da Oficina Rassë: catálogo público de produtos (impressão 3D e gravação/corte a laser),
cesta que termina numa conversa de WhatsApp, e dashboard privado de gestão.

O contexto permanente do projeto está em [CLAUDE.md](CLAUDE.md), o plano de execução em
[PLAN.md](PLAN.md), o estado em [PROGRESS.md](PROGRESS.md) e os bloqueios em
[BLOCKERS.md](BLOCKERS.md). O brief visual está em [DESIGN.md](DESIGN.md).

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · shadcn/ui · Neon (Postgres) ·
Drizzle ORM · Zod · pnpm · Vercel.

## Requisitos

- Node.js 22 ou superior
- pnpm 11 ou superior
- Uma base de dados Neon (Postgres)

## Correr localmente

```bash
pnpm install
cp .env.example .env.local   # preencher DATABASE_URL
pnpm dev
```

A aplicação fica em http://localhost:3000.

Se faltar `DATABASE_URL`, o arranque falha com uma mensagem explícita — a validação vive em
[lib/env.ts](lib/env.ts) e corre no arranque via [instrumentation.ts](instrumentation.ts).

## Scripts

| Comando            | O que faz                                           |
| ------------------ | --------------------------------------------------- |
| `pnpm dev`         | Servidor de desenvolvimento (Turbopack)             |
| `pnpm build`       | Build de produção                                   |
| `pnpm start`       | Servir o build de produção                          |
| `pnpm lint`        | ESLint                                              |
| `pnpm typecheck`   | `tsc --noEmit`                                      |
| `pnpm format`      | Prettier em todo o repositório                      |
| `pnpm db:generate` | Gera migrations a partir de `db/schema.ts`          |
| `pnpm db:migrate`  | Aplica migrations pendentes                         |
| `pnpm db:seed`     | Popula a base de dados com dados de desenvolvimento |
| `pnpm db:drop`     | Apaga o schema `public` (recusa em produção)        |
| `pnpm db:reset`    | `db:drop` + `db:migrate` + `db:seed`                |
| `pnpm db:studio`   | Abre o Drizzle Studio                               |

Antes de dar qualquer fase por concluída: `pnpm typecheck && pnpm lint && pnpm build`.

## Base de dados

O schema vive em [db/schema.ts](db/schema.ts) e é a fonte de verdade. Depois de o alterar:

```bash
pnpm db:generate   # escreve a migration em db/migrations/
pnpm db:migrate    # aplica-a
```

`pnpm db:reset` apaga o schema `public` inteiro antes de migrar e fazer seed — usar só em
desenvolvimento. O seed cria um administrador; a password vem de `SEED_ADMIN_PASSWORD` ou, se essa
variável não existir, é gerada e impressa uma única vez.

## Ambiente

Todas as variáveis estão listadas em [.env.example](.env.example), sem valores. Os segredos vivem
apenas em `.env.local` (ignorado pelo git) e nas variáveis de ambiente da Vercel.
