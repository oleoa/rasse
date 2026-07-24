# PROGRESS.md — Oficina Rassë

Estado de execução do `PLAN.md`. Uma entrada por fase, com checklist de aceitação verificada
item a item e o que fica pendente de verificação humana.

| Fase                                     | Estado      | Data       |
| ---------------------------------------- | ----------- | ---------- |
| 0 — Fundações                            | concluída   | 2026-07-24 |
| 1 — Schema e dados                       | por começar | —          |
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
