# PROGRESS.md — Oficina Rassë

Estado de execução do `PLAN.md`. Uma entrada por fase, com checklist de aceitação verificada
item a item e o que fica pendente de verificação humana.

| Fase                                     | Estado      | Data       |
| ---------------------------------------- | ----------- | ---------- |
| 0 — Fundações                            | concluída   | 2026-07-24 |
| 1 — Schema e dados                       | concluída   | 2026-07-25 |
| 2 — Design system e layout               | por começar | —          |
| 3 — Páginas públicas                     | por começar | —          |
| 4 — Cesta e envio para WhatsApp          | por começar | —          |
| 5 — Pedido de impressão personalizada    | por começar | —          |
| 6 — Autenticação e shell do dashboard    | por começar | —          |
| 7 — CRUD de produtos/categorias/settings | por começar | —          |
| 8 — Pedidos e orçamentos                 | por começar | —          |
| 9 — Analytics                            | por começar | —          |
| 10 — Lançamento                          | por começar | —          |

---

## Fase 0 — Fundações

**Data:** 2026-07-24 · **Estado:** concluída

### O que foi feito

- Scaffold `create-next-app@15` (Next.js 15.5.21, App Router, TypeScript, Tailwind v4, ESLint,
  pnpm, sem `src/`, alias `@/*`).
- `tsconfig.json`: `strict: true` e `noUncheckedIndexedAccess: true`; `target` subido para ES2022.
- shadcn/ui inicializado com base Radix e tema neutro (`components.json`, `lib/utils.ts`,
  tokens em `app/globals.css`). Adicionado `components/ui/button.tsx` como prova de ligação.
- Prettier 3 + `prettier-plugin-tailwindcss` (`.prettierrc.json`, `.prettierignore`).
- Drizzle ORM 0.45 + `@neondatabase/serverless` 1.1; `db/index.ts` exporta `db`;
  `drizzle.config.ts` com `casing: "snake_case"` e `out: ./db/migrations`.
- `lib/env.ts`: schema Zod das variáveis de ambiente, validado no arranque através de
  `instrumentation.ts`.
- Estrutura de pastas da secção 4 do `CLAUDE.md` criada com `.gitkeep`.
- `.env.example`, `.gitignore` (com `!.env.example`), `README.md`, `PROGRESS.md`, `BLOCKERS.md`.
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `db:generate`,
  `db:migrate`, `db:seed`, `db:studio`.

### Checklist de aceitação

| Critério                                                       | Resultado | Como foi verificado                                                                                                                                                                                                                               |
| -------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck && pnpm lint && pnpm build` passam             | OK        | Os três comandos corridos por esta ordem, todos com saída limpa. `next build` gerou 5 páginas estáticas sem avisos.                                                                                                                               |
| `pnpm dev` serve a página inicial sem erros na consola         | OK        | `pnpm dev` arrancado em background; `curl http://localhost:3000/` devolveu `status=200`, `<html lang="pt-BR">` e `<title>Oficina Rassë</title>`. Log sem erros nem avisos.                                                                        |
| `lib/env.ts` falha com mensagem clara se faltar `DATABASE_URL` | OK        | `.env.local` movido temporariamente; `pnpm dev` abortou com `Variáveis de ambiente inválidas: - DATABASE_URL: DATABASE_URL em falta. Copia .env.example para .env.local...`. `.env.local` restaurado a seguir.                                    |
| Nenhum segredo commitado                                       | OK        | `git check-ignore -v .env.local` → ignorado pela regra `.env*`; `.env.example` explicitamente designorado. `git diff --cached` filtrado por `postgres://`, `npg_`, `sk-`, `AUTH_SECRET=` só apanhou a string da mensagem de erro em `lib/env.ts`. |

### Decisões tomadas

- **Next.js 15, não 16.** `create-next-app@latest` instalou o Next 16; o `CLAUDE.md` fixa a versão
  15, por isso o scaffold foi refeito com `create-next-app@15` (15.5.21).
- **`build` sem `--turbopack`.** O scaffold gerou `next build --turbopack`; ficou `next build`
  porque o builder Turbopack ainda é beta no 15.5 e a Vercel usa o builder estável. `dev` mantém
  `--turbopack`.
- **`instrumentation.ts` para validar o ambiente no arranque.** É o único ponto do Next 15 que
  corre antes de servir pedidos; é nativo, não precisa de dependência nova.
- **`process.loadEnvFile(".env.local")` no `drizzle.config.ts`.** O drizzle-kit não lê `.env.local`
  e a alternativa seria instalar `dotenv`, que está fora da lista do `CLAUDE.md`. `loadEnvFile` é
  nativo do Node 20.12+.
- **`casing: "snake_case"`** no Drizzle, para escrever camelCase em TypeScript e manter
  snake_case na base de dados, como está na secção 5 do `CLAUDE.md`.
- **`allowBuilds` em `pnpm-workspace.yaml`.** O pnpm 11 deixou de ler `pnpm.onlyBuiltDependencies`
  do `package.json`; sem isto, `sharp` (usado pelo `next/image`) fica por compilar.
- **`components/ui` fora do Prettier.** Ficheiros gerados pelo shadcn ficam como vieram, conforme
  a regra do `CLAUDE.md` de não os editar à mão.
- **Home provisória em `app/(public)/page.tsx`**, não em `app/page.tsx`, para não colidir com o
  layout público da Fase 2. Sem conteúdo de negócio.

### A testar manualmente antes de confiar nesta fase

1. `pnpm dev` e abrir http://localhost:3000 — confirmar que não há erros nem avisos na consola do
   browser (a verificação automática só cobriu o log do servidor).
2. Confirmar que a `DATABASE_URL` em `.env.local` aponta para a base de dados Neon correta (a
   Fase 1 vai correr migrations e seed contra ela).

### Pronto para a fase seguinte

- `db/index.ts` exporta o cliente Drizzle e `drizzle.config.ts` aponta para `./db/schema.ts` —
  falta escrever esse ficheiro, que é o primeiro item da Fase 1.
- `db/migrations/` e `public/seed/` já existem.
- `lib/code.ts` (geração do `code`) ainda não existe; é da Fase 1.

---

## Fase 1 — Schema e dados

**Data:** 2026-07-25 · **Estado:** concluída

A fase está marcada `[HUMAN]` por precisar de `DATABASE_URL`. A chave já estava em `.env.local` e
aponta para um projeto Neon em `sa-east-1` (PostgreSQL 18.4), por isso não houve nada a pedir.

### O que foi feito

- `db/schema.ts` com as 12 tabelas da secção 5 do `CLAUDE.md`, 4 enums Postgres
  (`price_type`, `product_status`, `request_status`, `event_type`), 14 índices e 8 check
  constraints. Inclui as `relations` do Drizzle, para a API relacional de query.
- Migration inicial `db/migrations/0000_organic_sway.sql`, gerada e aplicada.
- `lib/code.ts`: alfabeto de 31 caracteres sem ambiguidades, 8 caracteres, formato `RS-XXXXXXXX`,
  amostragem por rejeição sobre `crypto.getRandomValues` (sem viés de módulo) e
  `generateUniqueCode(isTaken)` para verificação de colisão sem acoplar à base de dados.
- `db/seed.ts`: `settings` (singleton), 1 admin, 3 categorias e 8 produtos.
- 10 placeholders SVG em `public/seed/`, escuros, com moldura de cobre e legenda em monospace a
  descrever a foto em falta, conforme a secção 7 do `DESIGN.md`.
- `scripts/db-drop.ts` e os scripts `db:drop` / `db:reset`.
- `allowImportingTsExtensions` no `tsconfig.json`, para os scripts corridos directamente pelo Node.

### Checklist de aceitação

| Critério                                                                      | Resultado | Como foi verificado                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:reset` corre duas vezes seguidas sem erro                            | OK        | Corrido duas vezes de seguida. Ambas terminaram com `Schema public recriado`, `migrations applied successfully` e `Seed concluído` com 3 categorias e 8 produtos.                                                                                                                                                                                                                                     |
| Tentar inserir produto `on_request` com preço é rejeitado pela BD             | OK        | `INSERT` directo em SQL: `sqlstate=23514 constraint=products_price_matches_type`. O espelho (`fixed` com `price_cents NULL`) é rejeitado pela mesma constraint, e o controlo (`on_request` com `NULL`) é aceite. Verificados também `settings_singleton` e `cart_items_quantity_positive`.                                                                                                            |
| Query de um produto devolve categoria, imagens e variantes com tipos corretos | OK        | `db.query.products.findFirst` com `with: {category, images, variants}` devolveu a categoria "Gravação personalizada", 2 imagens e 2 variantes ordenadas. Os tipos foram provados estaticamente com atribuições explícitas (`Date`, `number \| null`, união dos enums) que o `tsc` aceitou — e uma atribuição deliberadamente errada fez o `tsc` falhar com TS2322, confirmando que a prova tem valor. |

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Estado dos dados após o seed

`produtos=8` (6 `published`, 1 `draft`, 1 `archived`), `sob_consulta=1`, `personalizaveis=2`,
`com_variantes=2`, `imagens=10`, `categorias=3`, `utilizadores=1`, `settings=1` — contado com
`SELECT count(*)` sobre a base de dados, não a partir do ficheiro de seed.

### Decisões tomadas

- **`event_daily` com `UNIQUE NULLS NOT DISTINCT` em vez de PK.** Ver `BLOCKERS.md`: o Postgres
  não aceita colunas anuláveis numa chave primária e `product_id` tem de ser anulável.
- **Um único enum `request_status`** partilhado por `carts.status` e `quote_requests.status`, por
  terem exactamente os mesmos quatro valores.
- **`categories` com `updated_at`**, seguindo a regra "as mutáveis têm `updated_at`". `users`,
  `product_images`, `product_variants`, `cart_items`, `quote_files` e `events` ficaram só com
  `created_at`, como está listado na secção 5.
- **`products.category_id` com `ON DELETE restrict`**, para cumprir "impedir apagar categoria com
  produtos" (Fase 7) ao nível da base de dados e não só da aplicação.
- **Password do admin nunca escrita em código.** O seed lê `SEED_ADMIN_PASSWORD`; se faltar, gera
  uma aleatória com `crypto.randomBytes` e imprime-a uma única vez.
- **`r2Key` dos placeholders com o prefixo `seed/`**, correspondendo a `public/seed/`. A Fase 3
  resolve `r2_key` para URL e trata este prefixo como local.
- **Check constraints extra** para além da exigida: preço não negativo, quantidade positiva,
  subtotal não negativo, tamanho de ficheiro positivo, `settings.id = 1`.
- **`bcryptjs` em vez do `bcrypt` nativo** — justificação em `BLOCKERS.md`.
- **`--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`** nos scripts do Node, para não ter de pôr
  `"type": "module"` no `package.json` (que mexeria com a resolução de módulos do Next).

### A testar manualmente antes de confiar nesta fase

1. `pnpm db:studio` e confirmar visualmente as 12 tabelas e os 8 produtos.
2. Confirmar que a password do admin impressa pelo último `pnpm db:reset` foi guardada — só será
   usada a partir da Fase 6 e não volta a ser mostrada.
3. Decidir se o `DATABASE_URL` actual é a base de desenvolvimento ou já a de produção. O
   `pnpm db:reset` apaga o schema `public` inteiro: se esta base vier a ser a de produção, é
   preciso separar já as branches Neon (previsto na Fase 10).

### Pronto para a fase seguinte

- Base de dados populada e consultável; `db.query` com relações a funcionar.
- `lib/code.ts` pronto para a Fase 4 (cestas) e Fase 5 (orçamentos).
- Tokens do `DESIGN.md` ainda por aplicar — é o primeiro item da Fase 2.
