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
| `pnpm files:clean` | Limpa ficheiros órfãos e fora da retenção (simula)  |
| `pnpm user:create` | Cria um administrador do painel                     |

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

## Ficheiros (Cloudflare R2)

O upload do formulário de orçamento vai **directo do browser para o bucket**, com um URL assinado
pedido a `POST /api/uploads/presign`. O corpo do ficheiro nunca passa pela Vercel — um STL de
40 MB rebentaria o limite de corpo das funções.

Para isso o bucket precisa de uma política de CORS que autorize o `PUT` a partir do domínio da
aplicação. No painel do R2, bucket → Settings → CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://rasse.strutura.ai"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

Cada domínio novo tem de ser acrescentado aqui, senão o browser bloqueia o upload.

Chaves: `quotes/{codigo_do_pedido}/{uuid}.{ext}`. A limpeza de ficheiros órfãos (upload feito,
formulário nunca submetido) e a retenção de 12 meses estão em `pnpm files:clean`, que por defeito
só simula — `pnpm files:clean --apply` é que apaga.

## Anti-spam (Cloudflare Turnstile)

O widget protege `POST /api/uploads/presign` e a submissão do orçamento. Sem ele, qualquer pessoa
podia pedir URLs assinados e encher o bucket à custa do dono.

**Em desenvolvimento local, usa as chaves de teste da Cloudflare.** O widget real está preso aos
hostnames configurados no painel; em `localhost` devolve o erro `110200` (domínio não autorizado).

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Estas chaves chamam o `siteverify` verdadeiro — mudar a secret para
`2x0000000000000000000000000000000AA` faz o servidor recusar tudo, o que é útil para testar o
caminho da recusa.

> `NEXT_PUBLIC_TURNSTILE_SITE_KEY` é embutida no bundle **durante o build**. Trocar a chave obriga
> a um novo build, não basta reiniciar o servidor.

## Painel

O painel vive em `/dashboard` e está fechado por `middleware.ts`. Não há registo público: os
administradores criam-se pela linha de comandos.

```bash
pnpm user:create                              # pergunta email, nome e password
pnpm user:create -- --email=a@b.c --name=Ana  # password continua a ser pedida
```

A password nunca passa por argumento nem por variável de ambiente, para não ficar no histórico da
shell. Mínimo de 10 caracteres, guardada com bcrypt a 12 rounds.

A sessão é um JWT assinado com `AUTH_SECRET`. **O valor tem de ser o mesmo em todos os ambientes de
um mesmo deploy** — mudá-lo invalida todas as sessões activas.

## Ambiente

Todas as variáveis estão listadas em [.env.example](.env.example), sem valores. Os segredos vivem
apenas em `.env.local` (ignorado pelo git) e nas variáveis de ambiente da Vercel.
