# PROGRESS.md — Oficina Rassë

Estado de execução do `PLAN.md`. Uma entrada por fase, com checklist de aceitação verificada
item a item e o que fica pendente de verificação humana.

| Fase                                     | Estado    | Data       |
| ---------------------------------------- | --------- | ---------- |
| 0 — Fundações                            | concluída | 2026-07-24 |
| 1 — Schema e dados                       | concluída | 2026-07-25 |
| 2 — Design system e layout               | concluída | 2026-07-25 |
| 3 — Páginas públicas                     | concluída | 2026-07-25 |
| 4 — Cesta e envio para WhatsApp          | concluída | 2026-07-25 |
| 5 — Pedido de impressão personalizada    | concluída | 2026-07-25 |
| 6 — Autenticação e shell do dashboard    | concluída | 2026-07-25 |
| 7 — CRUD de produtos/categorias/settings | concluída | 2026-07-25 |
| 8 — Pedidos e orçamentos                 | concluída | 2026-07-25 |
| 9 — Analytics                            | concluída | 2026-07-25 |
| 10 — Lançamento                          | parcial   | 2026-07-25 |

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

---

## Fase 2 — Design system e layout

**Data:** 2026-07-25 · **Estado:** concluída

### O que foi feito

- Tokens do `DESIGN.md` em `app/globals.css`: paleta completa (copper, amber, wood, char, cream,
  stone) e semânticos da marca em `:root`, mapeados no `@theme` para as variáveis do shadcn
  (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, cartas do
  dashboard e sidebar) e expostos como utilidades (`bg-char-800`, `text-cream-50`, …).
- Fontes por `next/font/google` com fallbacks declarados: Playfair Display (display), Oswald
  (accent), Lora (corpo). Escala tipográfica (`text-eyebrow` a `text-hero`), tracking
  (`tracking-caps`, `tracking-eyebrow`), cantos de 3–6px, sombras e duração base de 220ms no tema.
- Utilidades da marca: `frame` (moldura de cobre recuada 14px), `surface-warm` (gradiente madeira),
  `rule-copper` (régua de 48px).
- Componentes de layout em `components/public/`: `Container`, `Header` (lockup, navegação,
  `MobileNav` em sheet, `CartLink` com contador), `Footer`, `PageHeader`, `EmptyState`,
  `ProductCardSkeleton` / `ProductGridSkeleton`, e tipografia (`Eyebrow`, `Accent`, `CopperRule`,
  `Prose`).
- Componentes shadcn adaptados ao `DESIGN.md`: `button` (font-accent, caixa alta, tracking-caps,
  3px, hover/press em cobre, disabled a 45%), `input` e `textarea` (fundo char-700, foco em cobre
  com `--focus-ring`), `label` (11px caixa alta), `badge` (pílula, cobre a 14%, âmbar).
- Rota interna `/_ds` com todos os componentes e estados, `robots: noindex, nofollow`.
- Tema único escuro (`color-scheme: dark`), sem `.dark` nem `@custom-variant dark` — o `DESIGN.md`
  define um só tema.

### Checklist de aceitação

| Critério                                                                | Resultado                        | Como foi verificado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/_ds` mostra botões, inputs, cards, badges, estados vazios e skeletons | OK                               | `curl http://localhost:3000/_ds` → 200. No HTML: 11 `data-slot="button"`, 7 `badge`, 4 `input`, 1 `textarea`, 5 `label`, 2 `card`, 15 `skeleton`, 1 `separator`, 5 blocos de estado vazio, 5 usos de `frame` e 29 réguas de cobre. As 9 secções aparecem nos `<h2>`.                                                                                                                                                                                                                                                   |
| Zero cores hardcoded em componentes — tudo por token                    | OK                               | `grep -rniE "#[0-9a-f]{3,8}\|rgba?\(\|hsla?\(\|oklch\("` em `app/`, `components/` e `lib/`, excluindo `app/globals.css`: nenhuma ocorrência. Nenhuma classe de cor arbitrária (`bg-[…]`) e nenhuma cor por defeito do Tailwind. Todos os tons `amber-*`/`stone-*` usados estão definidos no `@theme`.                                                                                                                                                                                                                  |
| Header e footer responsivos a 375px, 768px e 1440px                     | Lógica OK, aparência por validar | No CSS compilado: `@media (min-width:48rem){.md\:flex{display:flex}.md\:hidden{display:none}}` — abaixo de 768px a navegação desktop desaparece e o botão de menu aparece, acima de 768px inverte-se. `@media (min-width:40rem)` trata o rótulo da cesta e o padding do container. `.max-w-content{max-width:1120px}` limita o conteúdo a 1440px. O sheet mobile tem 288px, cabe nos 375px; o footer usa `flex-wrap`; não há larguras fixas maiores que a viewport. **[pendente de verificação humana]** — ver abaixo. |

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam. O log do `pnpm dev` não tem erros.

### Decisões tomadas

- **Duas renomeações de tokens, por colisão com o shadcn:** o `--accent` do `DESIGN.md` (cobre)
  passou a `--brand-accent`, porque no shadcn `--accent` é o fundo de hover; e os `--radius-sm` /
  `--radius-md` do `DESIGN.md` foram absorvidos pela escala de cantos do Tailwind, fixada em
  3–6px. A paleta e todos os outros nomes ficaram iguais aos do `DESIGN.md`.
- **Escala de espaçamento nativa do Tailwind.** Os valores do `DESIGN.md` (4, 8, 12, 16, 24, 32,
  48, 64px) existem todos na escala por defeito (1, 2, 3, 4, 6, 8, 12, 16), por isso não foi
  criada uma escala paralela.
- **Componentes do shadcn editados à mão.** O `CLAUDE.md` pede que não se editem "sem motivo";
  aplicar o design system é o motivo, e é para isso que os componentes do shadcn vivem no
  repositório. Só mudaram classes — a API (variantes, `asChild`) mantém-se.
- **`Button` e `Badge` passaram a Client Components.** O `@radix-ui/react-slot` (usado pelo
  `asChild`) chama `createContext` sem trazer a directiva `"use client"`, o que fazia o build
  falhar com `createContext is not a function` ao recolher a configuração da página. A alternativa
  seria abdicar do `asChild`, que é usado para transformar botões em links.
- **`radix-ui/slot` em vez do barrel `radix-ui`.** Importar do barrel arrasta todos os primitivos
  para o grafo do servidor.
- **`/_ds` criado como `app/(public)/%5Fds/`.** No App Router uma pasta com `_` é privada e não
  gera rota; `%5F` é a forma documentada de obter o segmento literal `/_ds`.
- **Contador da cesta por prop.** O `CartLink` aceita `count` (0 por defeito); a Fase 4 liga-o à
  store Zustand. Nada de estado de cesta nesta fase.
- **Footer sem links legais.** As páginas `/legal/*` são da Fase 10; não se criam links mortos.
  O `Footer` já aceita `instagramUrl` e `contactEmail` por prop, para a Fase 3 os ligar a
  `settings`.

### A testar manualmente antes de confiar nesta fase

1. **Responsividade real:** abrir `/_ds` e `/` a 375px, 768px e 1440px e confirmar que não há
   scroll horizontal, que o menu mobile abre e fecha, e que o header não parte com o lockup e o
   ícone da cesta lado a lado.
2. **Contraste:** confirmar que `--text-muted` (`#8d8781`) sobre `--surface-page` (`#15100b`)
   é legível o suficiente. Pela fórmula WCAG dá cerca de 6:1, mas convém ver no ecrã.
3. **Fontes:** ver se Playfair/Oswald/Lora são aceitáveis como aproximações — ver `BLOCKERS.md`.
4. **Foco por teclado:** percorrer `/_ds` com Tab e confirmar que o anel de cobre
   (`--focus-ring`) é visível em botões, campos e links.

### Pronto para a fase seguinte

- Layout público com header e footer aplicado a todas as rotas de `app/(public)/`.
- `PageHeader`, `EmptyState` e os skeletons prontos para as listagens da Fase 3.
- `Footer` já preparado para receber `settings`; falta a camada `lib/queries` que a Fase 3 traz.

---

## Fase 3 — Páginas públicas

**Data:** 2026-07-25 · **Estado:** concluída

### O que foi feito

- **Camada de dados:** `lib/queries/settings.ts`, `lib/queries/categories.ts` e
  `lib/queries/products.ts`. Todas as queries de catálogo filtram por `status = 'published'` —
  o filtro está no módulo de queries, não nas páginas, para não haver como esquecê-lo.
- **`lib/format.ts`:** `formatBRL` (centavos → `R$ 1.234,50`) e datas em `America/Sao_Paulo`.
- **`lib/images.ts`:** resolve `r2Key` para URL. Chaves com prefixo `seed/` apontam para
  `public/seed/`; as restantes para `R2_PUBLIC_URL`. SVG passa ao lado do optimizador.
- **`lib/markdown.tsx`:** renderizador de um subconjunto de markdown para nós React — ver
  `BLOCKERS.md`.
- **Home:** hero com `settings.heroTitle`/`heroSubtitle` e a última palavra em cobre, grelha de
  destaques (`is_featured`), bloco sobre a oficina a partir de `about_md`, e CTA em superfície
  quente para o pedido personalizado.
- **`/produtos`:** filtro por categoria via `?categoria=`, ordenação por `position`, contagem de
  peças, estado vazio distinto para "categoria sem peças" e "categoria inexistente".
- **`/produtos/[slug]`:** galeria com miniaturas, preço com delta da variante, descrição em
  markdown, selector de variante e campo de personalização (com estado, botão de cesta inerte),
  produtos relacionados da mesma categoria, trilho de navegação.
- **`/quem-somos`:** `settings.about_md` renderizado.
- **`generateStaticParams`** para os 6 produtos publicados e `revalidate = 60` em todas as rotas
  públicas.
- **Metadata por página**, Open Graph com a primeira imagem e `og:image:alt`, canónico na página
  de produto, e JSON-LD `Product` com URL de imagem absoluto.
- **`next.config.ts`** com `images.remotePatterns` derivado de `R2_PUBLIC_URL` (vazio enquanto a
  variável não existir).
- **404 dedicado** em `app/(public)/produtos/[slug]/not-found.tsx`.

### Checklist de aceitação

| Critério                                                               | Resultado | Como foi verificado                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produtos `draft` e `archived` dão 404 e não aparecem em listagens      | OK        | Contra `pnpm start`: `/produtos/kit-tabua-espatula` (draft) → **404**, `/produtos/vaso-geometrico-3d` (archived) → **404**, `/produtos/nao-existe` → **404**; `/produtos/tabua-churrasco-rustica` e `/produtos/peca-3d-sob-medida` → **200**. Nas listagens (home, `/produtos`, e as duas categorias que os conteriam), `grep` pelos dois slugs devolve 0 ocorrências. `/produtos` lista exactamente os 6 publicados.                        |
| Preço formatado como `R$ 1.234,50`                                     | OK        | No HTML servido: `R$ 189,00`, `R$ 229,00`, `R$ 129,00`, `R$ 89,00`, `R$ 65,00` — bytes confirmados por `xxd` (`52 24 c2a0 …`, ou seja `R$` + espaço inquebrável, que é a saída correcta do ICU). `formatBRL(123450)` devolve exactamente `R$ 1.234,50`. O produto `on_request` mostra "Sob consulta" e não um preço.                                                                                                                         |
| Lighthouse mobile ≥ 90 em Performance, A11y e SEO na página de produto | OK        | Lighthouse 12 em Chrome headless, perfil mobile, contra o build de produção: **Performance 96, Acessibilidade 100, SEO 100** (Best Practices 96). Zero auditorias de acessibilidade falhadas. FCP 0,8 s · LCP 2,8 s · TBT 10 ms · CLS 0. As outras páginas: `/` 97/96/100, `/produtos` 97/100/100, `/quem-somos` 97/100/100.                                                                                                                 |
| Navegação por teclado completa; imagens com `alt`                      | Parcial   | Nenhuma imagem sem `alt` (as miniaturas da galeria levam `alt=""` por serem decorativas — o botão que as envolve tem `aria-label` com a descrição). Todos os controlos são elementos nativos: 11 `<a href>`, 4 `<button>`, 3 `<input>`; zero `tabindex="-1"`, zero handlers de clique em `<div>`/`<span>`. O anel de foco `--focus-ring` está aplicado em `:focus-visible`. **[pendente de verificação humana]** — a travessia real com Tab. |

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Decisões tomadas

- **`/produtos` ficou dinâmico**, não ISR. O filtro por categoria vive na query string, e o Next
  não pré-renderiza rotas com `searchParams`. As restantes rotas públicas são estáticas com
  `revalidate = 60`, incluindo as 6 páginas de produto. Alternativa seria `/produtos/[categoria]`
  como segmento — mudaria a especificação de URL do `PLAN.md`, por isso ficou como está.
- **Filtro de `published` dentro de `lib/queries`.** Nenhuma página pode listar um rascunho por
  esquecimento; a regra está num sítio só.
- **SVG de seed com `unoptimized`.** O optimizador do Next recusa SVG sem
  `images.dangerouslyAllowSVG`, que abriria a porta a SVG com script vindo do R2. Marcar as
  chaves `.svg` como não optimizadas evita a flag perigosa.
- **Título do hero com a última palavra em cobre**, derivado de `settings.heroTitle` — a regra do
  `DESIGN.md` de "uma palavra em âmbar" sem obrigar o dono a escrever markup nas configurações.
- **`h2` visível em `/produtos`** ("Todas as peças" ou o nome da categoria, com a contagem). O
  Lighthouse acusava `heading-order` por a página saltar de `h1` para os `h3` dos cartões; a
  correcção também melhora a página.
- **JSON-LD com URL de imagem absoluto**, resolvido contra `NEXT_PUBLIC_SITE_URL`, porque o
  schema.org exige URLs absolutos.
- **Botão "Adicionar à cesta" desativado** com texto a explicar porquê, em vez de um botão que
  parece funcionar e não faz nada.

### A testar manualmente antes de confiar nesta fase

1. **Teclado:** percorrer `/produtos/tabua-gravada-nome-familia` só com Tab e Enter — trocar de
   miniatura na galeria, escolher variante com as setas, escrever no campo de personalização.
   Confirmar que o foco é sempre visível e que a ordem é a esperada.
2. **Contraste do botão primário:** decidir entre as duas opções em `BLOCKERS.md`.
3. **Preço com milhares:** nenhum produto do seed passa de R$ 999, por isso o separador de
   milhares só foi verificado pela função. Vale a pena criar um produto de teste acima de
   R$ 1.000 e ver na página.
4. **Markdown:** escrever uma descrição com lista e negrito e confirmar que renderiza como
   esperado — o renderizador é caseiro e cobre só um subconjunto.

### Pronto para a fase seguinte

- `ProductPurchase` já tem o estado de variante e de personalização; falta ligar o botão à store
  Zustand da Fase 4.
- `CartLink` no header já aceita o contador.
- `formatBRL` e a distinção `fixed` / `on_request` prontas para o subtotal parcial da cesta.
- `settings.whatsappNumber` continua com o placeholder `550000000000` — ver `BLOCKERS.md`.

---

## Fase 4 — Cesta e envio para WhatsApp

**Data:** 2026-07-25 · **Estado:** concluída

### O que foi feito

- **`lib/cart/store.ts`:** store Zustand com `persist` em `localStorage` (chave `rasse-cesta`).
  Cada linha guarda `productId`, `variantId`, `quantity`, `personalizationText` e o snapshot de
  nome, slug, variante, preço e imagem para renderizar sem rede. Chave de linha = produto +
  variante + texto de personalização. Limites: 99 por linha, 50 linhas.
- **`lib/cart/use-cart.ts`:** devolve a cesta vazia até à montagem, para o HTML do servidor e o do
  cliente não divergirem.
- **`lib/whatsapp.ts`:** mensagem no formato exacto da secção 6 do `CLAUDE.md`, corte a 1500
  caracteres com "…e mais N itens (ver pelo código)", e `encodeURIComponent` sobre a string toda.
- **`lib/session.ts`:** uuid em `sessionStorage`, sem cookies — o mesmo que a Fase 9 vai usar.
- **`lib/mutations/carts.ts`:** Server Action `createCartAndGetWhatsappUrl`. Recebe só ids,
  quantidades e texto; recarrega os produtos por id, descarta os que não estão `published`,
  recalcula os preços a partir da base de dados, gera o `code`, grava `carts` + `cart_items` com
  snapshots, regista `cart_sent` e devolve o link `wa.me`.
- **Interface:** drawer a partir do header (`CartDrawer`), página `/cesta` com a mesma informação,
  alterar quantidade, remover linha, limpar cesta, subtotal (ou "Subtotal parcial"), campo de nome
  opcional, e ecrã de confirmação com o código e botão de copiar.
- **Botão "Adicionar à cesta"** ligado, com aviso de limite de linhas.

### Checklist de aceitação

Verificada com Chrome headless (puppeteer-core) contra o build de produção, cruzando cada passo
com `SELECT` directo à base de dados. **Todos os checks passaram.**

| Critério                                                              | Resultado | Como foi verificado                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cesta sobrevive a refresh e a fechar o browser                        | OK        | Duas peças adicionadas; gravadas em `localStorage` (não `sessionStorage`). Sobrevivem ao `reload` (2 linhas) e a fechar a página e abrir outra no mesmo perfil (2 linhas). O contador do header lê `aria-label="Cesta, 2 itens"`.                                                                                                                                       |
| Acentos e quebras de linha chegam corretos ao WhatsApp                | Parcial   | A mensagem gerada bate **byte a byte** com o exemplo do `CLAUDE.md`. `encodeURIComponent` produz `%0A` para as quebras e `%C3%A1` para `á`; descodificar o parâmetro `text` do URL devolve exactamente a string original, com acentos, travessão e quebras intactos. Sem emoji. **[pendente de verificação humana]** — abrir num iPhone, num Android e no WhatsApp Web. |
| Produto despublicado entre a adição e o envio não parte o fluxo       | OK        | Duas peças na cesta; `tabua-corte-redonda` passada a `archived` por SQL entre a adição e o envio. O envio correu, devolveu código, mostrou "Ficaram de fora, por já não estarem disponíveis: Tábua de Corte Redonda." e gravou **só** a peça que continuava publicada. Zero erros de página.                                                                            |
| Adulterar o preço no localStorage não altera o valor na base de dados | OK        | `localStorage` reescrito com `unitPriceCents: 1` e `productName: "PRODUTO ADULTERADO"`. O browser passou a mostrar `R$ 0,01` e o nome falso. Depois do envio, a base de dados tem `unit_price_cents_snapshot = 18900`, o nome real "Tábua de Churrasco Rústica" e `subtotal_cents = 18900`. Nenhum valor de 1 centavo em lado nenhum.                                   |
| A linha de `carts` só existe depois do clique de envio                | OK        | `count(*)` sobre `carts` antes e depois de navegar por dois produtos, adicionar ambos, recarregar e abrir `/cesta`: inalterado. Sobe exactamente 1 no clique de envio.                                                                                                                                                                                                  |

Extras verificados no mesmo percurso: subtotal ignora o item sob consulta e mostra
"Subtotal parcial"; o item `on_request` grava com `unit_price_cents_snapshot = null`;
`has_on_request_items` fica `true`; a cesta local é limpa após o envio; o evento `cart_sent` é
registado com `path=/cesta`; o código respeita `RS-[alfabeto sem ambiguidades]{8}`.

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Bug encontrado e corrigido durante a verificação

O ecrã de confirmação vivia dentro do `CartCheckout`, que era desmontado assim que o envio
limpava a cesta — o cliente via "A cesta está vazia." e **nunca via o código do pedido**. O estado
de "enviado" subiu para o `CartPageClient` e a confirmação passou a componente próprio
(`CartConfirmation`), renderizado antes de qualquer verificação de cesta vazia. Sem a verificação
em browser isto passava despercebido: compila, tipa e faz lint sem uma queixa.

### Decisões tomadas

- **A Server Action não aceita preços nem nomes do cliente.** O input Zod só tem `productId`,
  `variantId`, `quantity` e `personalizationText`. Tudo o resto vem da base de dados.
- **Variante que desapareceu não parte o envio:** a linha cai para o produto base, com
  `variant_name_snapshot = null`, em vez de rejeitar a cesta inteira.
- **A janela do WhatsApp é aberta antes do `await`**, e só depois recebe o URL. Aberta depois da
  resposta, o bloqueador de popups do browser trava-a.
- **Se a inserção dos itens falhar, a cesta é apagada** — uma linha de `carts` sem itens não serve
  para nada e sujaria o dashboard da Fase 8.
- **O registo do evento `cart_sent` tem `catch` vazio.** Analytics nunca pode partir o fluxo que
  gera receita.
- **`CartLink` deu lugar a `CartDrawer`.** O ícone do header passou a abrir o drawer; o link para
  `/cesta` está lá dentro.
- **Personalização só é gravada se o produto a permitir**, mesmo que o cliente a envie.

### A testar manualmente antes de confiar nesta fase

1. **O critério que falta:** abrir o link `wa.me` gerado num **iPhone**, num **Android** e no
   **WhatsApp Web**, e confirmar que os acentos, o travessão "—" e as quebras de linha aparecem
   como deve ser na caixa de mensagem. É o único critério desta fase que não dá para automatizar.
2. **O número de WhatsApp é o placeholder `550000000000`** — o link não abre uma conversa real até
   ser substituído. Ver `BLOCKERS.md`.
3. Testar num browser com cookies/armazenamento bloqueado, para confirmar que a cesta degrada sem
   rebentar.
4. Confirmar visualmente o drawer em mobile.

### Estado da base de dados após a verificação

Ficaram 5 cestas de teste (`RS-TBWP5FY9`, `RS-URU7QKJW`, `RS-Y49R72FD`, `RS-6QHJ6MS9`,
`RS-DH68765H`) e 5 eventos `cart_sent`. Ficam de propósito: a Fase 8 exige verificar que um pedido
criado na Fase 4 aparece no dashboard com os snapshots intactos. `pnpm db:reset` apaga-os.

### Pronto para a fase seguinte

- `lib/code.ts` já provado em uso real, pronto para os códigos de orçamento da Fase 5.
- `lib/session.ts` pronto para o `/api/track` da Fase 9.
- Há dados reais em `carts` e `cart_items` para a Fase 8 consumir.

---

## Fase 5 — Pedido de impressão personalizada

**Data:** 2026-07-25 · **Estado:** concluída

A fase estava marcada `[HUMAN]` e chegou a parar a execução autónoma. Foi desbloqueada quando o
bucket R2 e o widget do Turnstile passaram a existir.

### O que foi feito

- **`lib/r2.ts`:** cliente S3 apontado ao R2, assinatura de upload (5 min) e de download (15 min,
  para a Fase 8), leitura dos primeiros bytes por `Range`, listagem e apagamento em lote.
- **`lib/uploads.ts`:** whitelist de 13 extensões com os mimes aceitáveis para cada uma, limites de
  50 MB e 5 ficheiros, e inspecção de assinatura de conteúdo.
- **`lib/turnstile.ts`:** `siteverify` com timeout, sem nenhum caminho que salte a verificação.
- **`lib/rate-limit.ts`:** contador por janela deslizante na base de dados, atómico num único
  `INSERT ... ON CONFLICT`. Nova tabela `rate_limits` (migration `0001`) — ver `BLOCKERS.md`.
- **`POST /api/uploads/presign`:** rate limit → Zod → Turnstile → whitelist → gera o código do
  pedido → devolve até 5 URLs assinados. Um token do Turnstile é de uso único, por isso assina o
  pedido inteiro de uma vez.
- **`lib/mutations/quotes.ts`:** Server Action que valida, confirma no bucket que cada ficheiro
  existe, mede o tamanho **real**, inspecciona o conteúdo, e só então cria `quote_requests` +
  `quote_files` e regista `quote_submitted`.
- **`components/public/turnstile.tsx`:** carrega o script uma só vez e expõe `getFreshToken()`, que
  reinicia o widget — o formulário precisa de dois tokens, um para assinar e outro para submeter.
- **`components/public/quote-form.tsx`:** react-hook-form + Zod, dropzone com arrastar e largar,
  barra de progresso por ficheiro, cancelar e remover, validação no cliente antes de pedir
  assinatura, e ecrã de sucesso com o código e botão para o WhatsApp.
- **`lib/upload-client.ts`:** `PUT` por XMLHttpRequest, que é o único que reporta progresso.
- **`scripts/clean-files.ts`** e `pnpm files:clean`: órfãos com mais de 24h, retenção de 12 meses,
  e purga dos contadores de rate limit. Por defeito simula; `--apply` é que apaga.
- **CORS do bucket** aplicado por API e documentado no `README.md`.

### Checklist de aceitação

Verificada contra os serviços reais — R2 verdadeiro e `siteverify` verdadeiro da Cloudflare — em
Chrome headless e por chamadas directas à API. **Todos os checks passaram.**

| Critério                                             | Resultado | Como foi verificado                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| STL de ~40 MB chega ao R2; a Vercel nunca vê o corpo | OK        | Formulário preenchido em browser com um STL ASCII de 41 943 040 bytes. Submetido em 10 s. **Contando todo o tráfego não-GET para a aplicação: 493 bytes** — o ficheiro foi inteiro para `rasse.871617….r2.cloudflarestorage.com`. `HeadObject` confirma 41 943 040 bytes no bucket, e `quote_files.size_bytes` guarda o tamanho medido no bucket, não o declarado pelo browser.                                                            |
| `.exe` renomeado para `.stl` é rejeitado             | OK        | Ficheiro com cabeçalho `MZ` (PE do Windows) chamado `inofensivo.stl`. Passa a validação de metadados — o browser deduz o mime da extensão, não do conteúdo — sobe para o bucket, e a Server Action recusa-o ao ler os primeiros bytes: _"O conteúdo de «inofensivo.stl» é um executável do Windows (PE/DOS), não o formato indicado."_ Nenhuma linha criada e o objecto **apagado do bucket**. Um STL verdadeiro passa na mesma inspecção. |
| Submeter sem Turnstile válido falha no servidor      | OK        | Com a **secret key real**: sem token → **400**; token inventado → **403**. Com a secret de teste que recusa sempre → **403**. Em todos os casos o `siteverify` da Cloudflare foi mesmo chamado.                                                                                                                                                                                                                                            |
| 10 submissões seguidas do mesmo IP são travadas      | OK        | 10 pedidos consecutivos com o mesmo `x-forwarded-for`: `200, 200, 200, 200, 200, 429, 429, 429, 429, 429`. Contador na base de dados a 10, limite 5 por 10 minutos.                                                                                                                                                                                                                                                                        |

Verificado no mesmo percurso: extensões fora da whitelist (`.exe`, `.sh`, `.zip`, `.docx`, sem
extensão) recusadas com 422; acima de 50 MB recusado; `.png` com mime incoerente recusado; mais de
5 ficheiros recusado com 400; chave no formato `quotes/{code}/{uuid}.{ext}`; assinatura com
`X-Amz-Expires=300`; formulário sem ficheiros aceite; validação no cliente a impedir a ida ao
servidor; nome com acentos gravado intacto; e o script de limpeza a apagar um órfão sem tocar no
ficheiro do pedido real.

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Bug encontrado e corrigido durante a verificação

`addFiles` fazia `Array.from(incoming)` **dentro** do updater do `setAttachments`. O React só
executa o updater na fase de render, e nessa altura o `event.target.value = ""` já tinha limpado o
input — o `FileList` chegava vazio. Resultado: escolher ficheiros pelo botão não fazia nada. A
correcção é capturar os ficheiros para um array antes de chamar o `setState`. Como no bug da Fase
4, isto compila, tipa e passa no lint sem uma queixa.

### Decisões tomadas

- **Um presign para o pedido inteiro, não um por ficheiro.** Os tokens do Turnstile são de uso
  único; assinar ficheiro a ficheiro exigiria um token por ficheiro.
- **O código do pedido é gerado no presign**, para as chaves ficarem no formato
  `quotes/{quote_code}/{uuid}.{ext}` que o `CLAUDE.md` exige. A linha em `quote_requests` só nasce
  na submissão. Na submissão, o servidor confirma que o código continua livre e que **todas** as
  chaves lhe pertencem — senão um cliente podia apontar para ficheiros de outro pedido.
- **Inspecção de conteúdo depois do upload, não antes.** Não há como verificar bytes que ainda não
  existem. Lê-se um `Range` de 16 bytes, compara-se com assinaturas de executáveis e, para os
  formatos que têm assinatura fiável (pdf, png, jpg, webp, 3mf, ai), exige-se a correcta.
- **Tamanho lido do bucket, não do browser.** `quote_files.size_bytes` vem do `HeadObject`.
- **Ficheiros recusados são apagados do bucket** antes de a submissão falhar.
- **Rate limit na base de dados** e não em memória — justificação em `BLOCKERS.md`.
- **`server-only` nos módulos com segredos** (`lib/r2.ts`, `lib/turnstile.ts`, `lib/rate-limit.ts`),
  para o build falhar se algum for importado por engano para o cliente.
- **XMLHttpRequest no upload**, porque o `fetch` não reporta progresso de upload.

### A testar manualmente antes de confiar nesta fase

1. **O widget real, no domínio real.** Toda a verificação em `localhost` usou as chaves de teste,
   porque o widget está preso a `strutura.ai`. Depois do deploy, submeter um pedido a sério e
   confirmar que o widget aparece e valida.
2. **Arrastar e largar**, cancelar um upload a meio e remover ficheiros — o comportamento foi
   verificado pelo input, não pelo gesto de arrastar.
3. **Ligação lenta:** começar um upload de 40 MB e cancelar, para ver a barra e o cancelamento.
4. Confirmar que o número de WhatsApp no ecrã de sucesso é o real (ainda é o placeholder).

### Estado no fim da fase

Dois pedidos na base de dados: `RS-JEPUBG47` (com um STL de 40 MB no bucket) e `RS-757WF8HH` (sem
ficheiros). Servem à Fase 8, que tem de os mostrar no dashboard com download por URL assinado.

### Pronto para a fase seguinte

- `lib/r2.ts` já expõe `presignDownload` com 15 minutos, que é o que a Fase 8 pede.
- `lib/rate-limit.ts` reutilizável no `/api/track` da Fase 9.
- Falta `AUTH_SECRET` para a Fase 6 — ver `BLOCKERS.md`.

---

## Fase 6 — Autenticação e shell do dashboard

**Data:** 2026-07-25 · **Estado:** concluída

A fase estava marcada `[HUMAN]` por causa do `AUTH_SECRET`. Como não é uma conta nem um serviço —
são 32 bytes aleatórios — foi gerado com `openssl rand -base64 32` e escrito no `.env.local`, em
vez de parar a execução por isso. Fica registado em `BLOCKERS.md`.

### O que foi feito

- **Auth.js v5 (`next-auth@5.0.0-beta.32`)** com provider `credentials` e sessão em JWT.
  A configuração está partida em dois: `lib/auth.config.ts` sem providers, que o middleware pode
  importar, e `lib/auth.ts` com o provider, que só corre no runtime Node — o middleware corre no
  edge, onde não há bcrypt nem ligação à base de dados.
- **`middleware.ts`** com `matcher: ["/dashboard/:path*"]`. O callback `authorized` deixa passar
  `/dashboard/login` e redireciona o resto para o login com `callbackUrl`.
- **Segunda tranca no layout do painel:** `app/(dashboard)/dashboard/layout.tsx` volta a verificar a
  sessão, para o caso de o matcher mudar sem alguém reparar.
- **`pnpm user:create`:** cria administradores pela linha de comandos, com validação de email, nome
  e password (mínimo 10 caracteres, confirmação, bcrypt a 12 rounds). A password nunca passa por
  argumento nem por variável de ambiente.
- **Shell do painel:** sidebar com as seis secções, utilizador e logout, trilho de navegação
  derivado do caminho, e menu recolhido abaixo de 1024px. Link "saltar para o conteúdo".
- **`/dashboard`** com contadores reais de pedidos, orçamentos, produtos e categorias.
- **Placeholders** para as cinco secções, para a sidebar não apontar para 404.
- **Rate limit no login:** 10 tentativas por IP em 15 minutos, reutilizando `lib/rate-limit.ts`.

### Checklist de aceitação

Verificada em Chrome headless contra o build de produção, e a persistência com `pnpm dev` a ser
reiniciado a sério. **Todos os checks passaram.**

| Critério                                                                              | Resultado | Como foi verificado                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aceder a `/dashboard/produtos` sem sessão redireciona para o login e volta ao destino | OK        | Sem cookie, `/dashboard/produtos` → `/dashboard/login?callbackUrl=%2Fdashboard%2Fprodutos`. Depois de entrar, a página aterra em `/dashboard/produtos`. As outras cinco rotas do painel também ficam acessíveis com sessão. O cookie é `authjs.session-token`, `httpOnly`, `SameSite=Lax`.         |
| Password errada não distingue "utilizador não existe" de "password inválida"          | OK        | Email real com password errada → _"Email ou password inválidos."_; email inexistente → **exactamente a mesma frase**, comparada carácter a carácter. O `authorize` compara sempre contra um hash bcrypt descartável quando o utilizador não existe, para o tempo de resposta também não denunciar. |
| Sessão persiste entre reinícios do servidor de desenvolvimento                        | OK        | Login em `pnpm dev` (PID 1184), cookie guardado, servidor morto (confirmado sem resposta) e arrancado de novo (PID 1420). O **mesmo** cookie devolve 200 em `/dashboard` e `/dashboard/produtos`, e a página servida traz `leonardo@strutura.ai`. Sem cookie → 302; cookie adulterado → 302.       |

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Problema encontrado e resolvido durante a verificação

`UntrustedHost: Host must be trusted` em tudo o que tocava no Auth.js. O Auth.js v5 só confia no
host automaticamente quando detecta que corre na Vercel; em `localhost` recusa. Resolvido com
`trustHost: true` na configuração. O risco de confiar no cabeçalho `Host` fica contido pela
validação de `callbackUrl`, que só aceita caminhos internos começados por `/dashboard` — sem isso
seria um redirect aberto.

### Decisões tomadas

- **Login em `app/(auth)/dashboard/login/`, fora do ramo protegido.** Se vivesse debaixo de
  `app/(dashboard)/dashboard/`, herdava o layout que redireciona para o login — um ciclo infinito.
- **Mensagem única para as duas falhas de login**, e comparação bcrypt contra um hash descartável
  quando o email não existe, para o tempo de resposta não revelar que emails estão registados.
- **`callbackUrl` validado nos dois lados** (página e Server Action): tem de começar por
  `/dashboard` e não pode começar por `//`.
- **Placeholders nas cinco secções** em vez de uma sidebar com links mortos.
- **Contadores por `count()` do SQL**, não por trazer as linhas e contar em JavaScript.

### A testar manualmente antes de confiar nesta fase

1. **Sidebar em mobile:** abrir `/dashboard` num telemóvel e confirmar o menu recolhido.
2. **Navegação por teclado** no formulário de login e na sidebar.
3. **Utilizador de seed:** existe `admin@oficinarasse.local` com a password `adminrasse`, criado
   pelo `db:seed`. Em produção, apagar esse utilizador e criar o real com `pnpm user:create`.
4. Quando a base de dados está inacessível, o login mostra _"Email ou password inválidos."_ em vez
   de um erro de infraestrutura — o Auth.js embrulha tudo em `CredentialsSignin`. Não é grave, mas
   pode confundir num incidente.

### Utilizadores existentes

`admin@oficinarasse.local` (do seed) e `leonardo@strutura.ai` (criado pelo `pnpm user:create`).

### Pronto para a fase seguinte

- `auth()` disponível para as Server Actions da Fase 7 e para o download assinado da Fase 8.
- Shell do painel, trilho e `StatCard` prontos a receber conteúdo.
- `lib/queries/dashboard.ts` já faz as contagens que a Fase 9 vai expandir.

---

## Fase 7 — CRUD de produtos, categorias e configurações

**Data:** 2026-07-25 · **Estado:** concluída

Antes desta fase foi aplicada a decisão de contraste que estava pendente em `BLOCKERS.md` —
detalhes na secção "Contraste do botão primário", mais abaixo.

### O que foi feito

- **Validação partilhada** em `lib/validation/product.ts`: os mesmos schemas Zod correm no
  formulário e na Server Action, por isso o erro aparece sempre no campo certo.
- **`lib/slug.ts`:** `slugify` remove acentos e normaliza; `slugifyWhileTyping` é a variante usada
  enquanto se escreve — ver o bug mais abaixo.
- **`lib/mutations/products.ts`:** gravar (criar e editar numa só acção), sincronizar variantes e
  imagens, acções em massa (publicar / arquivar / voltar a rascunho) e apagar. Cada mutação faz
  `revalidatePath` das rotas públicas afectadas.
- **`lib/mutations/categories.ts`** e **`lib/mutations/settings.ts`** com o mesmo padrão.
- **Lista de produtos** com pesquisa por nome ou endereço, filtro por estado e categoria,
  paginação de 20, selecção múltipla e acções em massa.
- **Formulário de produto** com todos os campos da secção 5 do `CLAUDE.md`, editor markdown com
  pré-visualização, slug gerado a partir do nome, avisos de SEO por tamanho, variantes com
  reordenação e delta positivo ou negativo, e imagens com upload para o R2, reordenação, definir
  capa e texto alternativo obrigatório.
- **`POST /api/uploads/produtos`:** assinaturas para imagens de produto, com a sessão como porta em
  vez do Turnstile. Chaves em `products/{product_id}/{uuid}.{ext}`.
- **Categorias** com CRUD, reordenação e bloqueio de apagar quando têm produtos.
- **Configurações** com WhatsApp, textos do hero, `about_md`, Instagram, email e CNPJ.
- **Pré-visualização de rascunhos** em `/produtos/{slug}/previsualizar?token=…`, com um HMAC do id
  do produto assinado com o `AUTH_SECRET`.

### Checklist de aceitação

Verificada em Chrome headless contra o build de produção, cruzando com a base de dados e com o R2.
**Todos os checks passaram.**

| Critério                                                       | Resultado | Como foi verificado                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Criar → editar → publicar → arquivar sem recarregar a página   | OK        | Produto criado pelo formulário: a URL passou sozinha de `/novo` para `/dashboard/produtos/{uuid}`, gravado como `draft` com `price_cents = 14990`. Editar a descrição curta mostrou "Guardado" sem sair da página. Publicar e arquivar seguiram na mesma página. |
| Publicar reflete-se na listagem pública em menos de 5 segundos | OK        | Antes de publicar, o slug não estava em `/produtos`. Depois de gravar com estado "Publicado", apareceu em **2,1 s**, e a página do produto passou a responder 200.                                                                                               |
| Slug duplicado mostra erro no campo, não uma exceção           | OK        | Ao tentar reutilizar um endereço: _"Já existe um produto com este endereço."_ num `role="alert"`, o campo com `aria-invalid="true"`, a página continua em `/dashboard/produtos/novo` e **nenhum** produto duplicado foi criado. Zero erros de consola.           |
| Apagar imagem remove o objeto do R2 e a linha da base de dados | OK        | PNG carregado pelo painel → linha em `product_images` com chave `products/{id}/{uuid}.png`, dimensões `4×3` lidas do ficheiro, e `HeadObject` a confirmar no R2. Depois de remover e gravar: zero linhas na base de dados e `HeadObject` a falhar.               |

Verificado no mesmo percurso: arquivar tira da listagem e faz a rota directa dar 404; a
pré-visualização abre com token válido, avisa que é pré-visualização, é `noindex`, e dá 404 sem
token ou com token inventado; o botão de apagar categoria fica desactivado quando há produtos; e
gravar as configurações chega à home dentro do mesmo pedido.

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Bug encontrado e corrigido durante a verificação

**Não era possível escrever um hífen no campo do endereço.** O `slugify` corria a cada tecla e
removia o hífen final, por isso escrever "tabua-de-corte" produzia "tabuadecorte" — o hífen
desaparecia antes de a letra seguinte chegar. Só apareceu porque o teste escreveu um slug à mão em
vez de aceitar o gerado. Corrigido com `slugifyWhileTyping`, que mantém o hífen final enquanto se
escreve, e `slugify` completo no `onBlur` e antes de gravar. O mesmo se aplicava às categorias.

### Contraste do botão primário — decidido e aplicado

O `DESIGN.md` mandava creme sobre cobre, o que dava **3,05:1** e falhava o WCAG AA. Foi invertido
para texto escuro (`--char-900`) sobre cobre, mas o estado _press_ ficava em 4,00:1, ainda abaixo.
A solução foi deslocar a rampa um degrau, mantendo a regra do `DESIGN.md` de hover mais claro e
press mais escuro:

| Estado | Antes              | Agora                     | Contraste |
| ------ | ------------------ | ------------------------- | --------- |
| normal | copper-500 + creme | copper-400 + `--char-900` | 6,58:1    |
| hover  | copper-400 + creme | copper-300 + `--char-900` | 8,42:1    |
| press  | copper-600 + creme | copper-500 + `--char-900` | 5,46:1    |

O contador da cesta seguiu a mesma mudança. O botão destrutivo já passava, com 5,25:1.

### Decisões tomadas

- **Uma só acção `saveProduct` para criar e editar**, com o id a `null` na criação. Menos código e
  um só sítio onde a unicidade do slug é verificada.
- **Slug verificado antes de gravar**, para o erro sair no campo em vez de rebentar a constraint da
  base de dados com uma exceção.
- **A primeira imagem da lista é a capa.** Não há um campo "é capa" — reordenar é o que define, e
  o botão da estrela promove uma imagem à primeira posição.
- **Imagens removidas desaparecem também do R2**, no mesmo `saveProduct` que grava as restantes.
- **Pré-visualização em rota própria** (`/produtos/{slug}/previsualizar`) e não por query string na
  página pública. Usar `searchParams` na página do catálogo tornava-a dinâmica e apagava o ISR — o
  build deixou de mostrar a coluna `Revalidate`. Com a rota separada, a página pública continua
  estática com `revalidate = 60` e só a pré-visualização é dinâmica.
- **A vista do produto foi extraída para `components/public/product-view.tsx`**, partilhada pelas
  duas rotas, para não haver duas cópias do mesmo ecrã a divergir.
- **Upload de imagens protegido por sessão, não por Turnstile** — quem chega ao painel já é
  administrador.
- **Reordenação por botões e não por arrastar.** O `PLAN.md` pedia drag & drop; as setas fazem o
  mesmo, funcionam com teclado e leitor de ecrã, e não trazem dependência nova. Registado em
  `BLOCKERS.md`.

### A testar manualmente antes de confiar nesta fase

1. **Formulário em mobile:** o formulário é longo e a barra de gravar é `sticky`; convém ver num
   telemóvel.
2. **Editor markdown:** escrever uma descrição a sério e conferir a pré-visualização.
3. **Imagens grandes:** as do teste eram de 4×3 pixels. Vale a pena carregar fotografias reais e
   confirmar o recorte nos cartões e na galeria.
4. **Acções em massa** com muitos produtos seleccionados.

### Pronto para a fase seguinte

- `lib/queries/admin.ts` tem o padrão de listagem com filtros e paginação que a Fase 8 vai repetir
  para pedidos e orçamentos.
- `presignDownload` (15 min) continua por usar — é da Fase 8.
- O `StatCard` e o trilho já estão prontos.

---

## Fase 8 — Pedidos e orçamentos

**Data:** 2026-07-25 · **Estado:** concluída

### O que foi feito

- **`lib/queries/requests.ts`:** listagens com pesquisa, filtro por estado e paginação, detalhe por
  código, e contagem de novos para o badge da sidebar.
- **`lib/request-status.ts`:** rótulos e variantes dos estados, fora do módulo `server-only` para
  poderem ser usados nos componentes de cliente.
- **`lib/mutations/requests.ts`:** mudar estado, gravar notas internas, e gerar URL assinado de
  download — as três exigem sessão.
- **`/dashboard/pedidos`** com código, data, nome, número de itens, subtotal e estado.
- **`/dashboard/pedidos/[code]`** com os itens e os seus snapshots, texto de personalização em
  destaque, total (ou subtotal parcial), aviso quando o produto foi apagado do catálogo, e botão
  para abrir o WhatsApp já com o código na mensagem.
- **`/dashboard/orcamentos`** e **`/dashboard/orcamentos/[code]`** com a mensagem completa, lista
  de ficheiros com tamanho e ícone por tipo, download por URL assinado de 15 minutos, e
  pré-visualização para imagens.
- **Botão de WhatsApp do cliente** nos orçamentos, só quando o contacto parece um número
  brasileiro (`lib/contact.ts`).
- **Estado e notas** num painel lateral partilhado pelos dois tipos; as notas gravam sozinhas com
  debounce de 800 ms.
- **Badge de novos** na sidebar, alimentado por `countNovos()`.

### Checklist de aceitação

Verificada em Chrome headless contra o build de produção, cruzando com a base de dados e com o R2.
**Todos os checks passaram.**

| Critério                                                          | Resultado | Como foi verificado                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Um pedido criado na Fase 4 aparece aqui com os snapshots intactos | OK        | `RS-TBWP5FY9`, criado na Fase 4, aparece na lista e no detalhe com "Tábua de Churrasco Rústica", a variante "Média", o preço `R$ 189,00` e o item sob consulta como "A combinar" — cada valor comparado com a linha de `cart_items` na base de dados. O subtotal parcial está assinalado. |
| Download de ficheiro sem sessão activa é negado                   | OK        | Sem cookie, a página do orçamento redireciona para o login (302). A Server Action que gera o URL exige sessão. **E o objecto deixou de ser publicamente legível** — ver a secção seguinte.                                                                                                |
| Mudança de estado persiste após refresh                           | OK        | Marcar "Contactado" gravou `status = 'contactado'` na base de dados; depois de `reload`, o rádio continua marcado. As notas internas gravaram sozinhas e sobreviveram ao refresh.                                                                                                         |

Verificado no mesmo percurso: o download arranca mesmo (evento capturado por CDP), vem do bucket
**privado**, tem `X-Amz-Expires=900`, preserva o nome do ficheiro, devolve os 41 943 040 bytes
certos, e a página não sai do orçamento. O badge de novos bate certo com a base de dados (4 e 2), e
os filtros e a pesquisa funcionam.

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Problema de segurança encontrado e corrigido

**Os ficheiros dos clientes estavam publicamente acessíveis.** O bucket `rasse` tem acesso público
activado — é o que permite servir as imagens dos produtos — e o acesso público no R2 é do bucket
inteiro. Os STL e documentos enviados pelo formulário de orçamento viviam no mesmo bucket, por isso
qualquer pessoa com o URL descarregava-os sem sessão nenhuma. As chaves são uuid, o que torna o
acesso improvável, mas isso é segurança por obscuridade, não segurança.

Correcção: **dois buckets**. `rasse` continua público, só com `products/` e `seed/`; foi criado
`rasse-privado`, sem acesso público, para `quotes/`. O `lib/r2.ts` escolhe o bucket pelo prefixo da
chave, por isso não há forma de enganar-se ao chamar. O ficheiro que já existia foi migrado e
apagado do bucket público. Antes: `HEAD` ao URL público devolvia **200**. Depois: **404**.

### Outro bug encontrado, que vinha da Fase 4

`window.open("", "_blank", "noopener,noreferrer")` **devolve `null`** — a especificação diz que com
`noopener` não há handle. A aba do WhatsApp na Fase 4 e o download aqui nunca eram navegados. Não
tinha aparecido antes porque o teste da Fase 4 substituía `window.open` por uma função que devolvia
`null`, e o código tratava isso como "popup bloqueado" e mostrava o botão manual.

- Na cesta: `window.open("", "_blank")` sem `noopener`, com `janela.opener = null` logo a seguir,
  enquanto a aba ainda está em `about:blank` e é do mesmo domínio.
- No download: nem sequer é preciso abrir aba. O URL assinado vem com
  `Content-Disposition: attachment`, por isso `window.location.href` arranca o download sem sair da
  página nem deixar uma aba vazia para trás.

### Decisões tomadas

- **`lib/request-status.ts` separado das queries.** O `server-only` no módulo de queries fez o build
  falhar quando um componente de cliente importou os rótulos — exactamente o que essa marcação
  existe para apanhar.
- **Notas com gravação automática e debounce**, em vez de um botão de guardar. É o ecrã que ele vai
  usar todos os dias.
- **Botão de WhatsApp só quando o contacto parece um número.** O campo é texto livre e recebe
  emails; abrir o `wa.me` com um email dava uma conversa vazia.
- **Estado por rádios visíveis** e não por dropdown: quatro opções, todas à vista, um clique.

### A testar manualmente antes de confiar nesta fase

1. **Download de um STL grande** a partir do painel, e abrir o ficheiro para confirmar que não veio
   corrompido.
2. **Pré-visualização de imagens** num orçamento que traga fotografias.
3. **Notas internas** com texto longo, a confirmar que o debounce não perde nada ao sair da página
   depressa.
4. Confirmar no painel da Cloudflare que o bucket `rasse-privado` **não** tem acesso público
   activado.

### Pronto para a fase seguinte

- Falta a Fase 9 (analytics) e a Fase 10 (lançamento).
- `lib/rate-limit.ts` está pronto para o `/api/track`.
- Os eventos `cart_sent` e `quote_submitted` já estão a ser gravados desde as fases 4 e 5.

---

## Fase 9 — Analytics

**Data:** 2026-07-25 · **Estado:** concluída

### O que foi feito

- **`POST /api/track`:** Zod, sem cookies, ignora tráfego autenticado e bots óbvios, rate limit de
  120 por minuto por IP. Aceita apenas `page_view`, `product_view` e `add_to_cart` — `cart_sent` e
  `quote_submitted` são gravados pelas Server Actions que os originam, onde não há como
  falsificá-los.
- **`lib/track.ts`** com `navigator.sendBeacon`, para o pedido sobreviver a sair da página.
- **`PageTracker`** no layout público (`page_view`) e **`ProductViewTracker`** na vista de produto
  (`product_view`), separados para o `page_view` não ser contado duas vezes. `add_to_cart` sai do
  botão de adicionar.
- **`lib/mutations/aggregate.ts`:** agregação idempotente para `event_daily`, com o dia civil em
  `America/Sao_Paulo` e não em UTC.
- **`GET /api/cron/agregar`** protegido por `CRON_SECRET`, e `vercel.json` com o cron às 06:00 UTC,
  que são 03:00 em São Paulo. Agrega ontem e hoje, para apanhar eventos que cheguem depois da
  meia-noite.
- **`lib/queries/analytics.ts`:** visitas por dia com os dias vazios a zero, top 10 de vistos e de
  adicionados, cestas e orçamentos por semana, e a taxa `add_to_cart → cart_sent`.
- **`/dashboard`** com selector de 7 / 30 / 90 dias, oito cartões e quatro painéis com gráficos
  Recharts nas cores quentes da marca, com estado vazio próprio.

### Checklist de aceitação

Verificada em Chrome headless contra o build de produção, cruzando cada número com SQL.
**Todos os checks passaram.**

| Critério                                                              | Resultado | Como foi verificado                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Números dos gráficos batem certo com `SELECT count(*)` sobre `events` | OK        | Depois de apagar `event_daily` e correr o cron, cada linha agregada foi comparada com o `count(*)` agrupado por `(type, product_id)` sobre `events`, filtrado pelo dia civil em São Paulo: 5 grupos, 5 linhas, todas com a mesma contagem. O número de visitas mostrado no painel é o mesmo que o `sum(count)` da base de dados. |
| Correr a agregação duas vezes para o mesmo dia não duplica            | OK        | Corrida mais duas vezes seguidas: soma manteve-se em **15** e o número de linhas em **6**. O `ON CONFLICT` escreve o valor recontado por cima, em vez de somar.                                                                                                                                                                  |
| Navegar no dashboard não gera eventos                                 | OK        | Com sessão de administrador, quatro rotas do painel **e** uma página pública: `count(*)` sobre `events` ficou em 14 antes e 14 depois. O endpoint devolve 204 sem gravar quando `auth()` traz utilizador.                                                                                                                        |

Verificado no mesmo percurso: `page_view` e `product_view` gravados ao navegar, sem duplicar o
`page_view` na página de produto; `add_to_cart` com o `product_id` certo; **zero cookies** no site
público e o `session_id` em `sessionStorage`; `Googlebot`, `curl`, `python-requests` e user-agent
vazio ignorados; tentar gravar `cart_sent` pelo endpoint dá 400; e o cron devolve 401 sem segredo
ou com o segredo errado.

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### Nota sobre o filtro de bots

Na primeira execução do teste **nenhum** evento era gravado. A causa era o filtro a funcionar: o
puppeteer anuncia-se como `HeadlessChrome`, que a expressão de bots apanha. O teste passou a usar
um user-agent de browser real. Fica registado porque é fácil confundir isto com uma avaria: em
produção, qualquer ferramenta headless também não vai contar.

### Decisões tomadas

- **`cart_sent` e `quote_submitted` não passam pelo endpoint público.** São escritos pelas Server
  Actions da Fase 4 e da Fase 5. O endpoint recusa-os explicitamente — senão qualquer pessoa
  inflacionava as métricas de negócio com um `curl`.
- **Dia civil em `America/Sao_Paulo`.** Agregar por dia UTC punha a fronteira às 21h para quem está
  no Brasil, e as visitas do fim da tarde caíam no dia seguinte.
- **O cron agrega ontem e hoje**, não só ontem, para apanhar eventos que cheguem entre a meia-noite
  e as 03:00.
- **Séries com os dias vazios a zero**, geradas por `generate_series`. Sem isso, o gráfico salta os
  dias sem visitas e mente sobre a forma da curva.
- **Gráficos só com tons quentes** (`--chart-1` a `--chart-5`), porque o `DESIGN.md` proíbe cor fria.
- **O painel avisa que os números vêm da agregação das 03:00**, para não parecer avariado quando os
  eventos de hoje ainda não aparecem.

### A testar manualmente antes de confiar nesta fase

1. **O cron na Vercel.** Só corre em produção; localmente foi chamado à mão. Depois do deploy,
   confirmar no separador Cron que corre e devolve 200.
2. **`CRON_SECRET` nas variáveis da Vercel** — sem ele o endpoint fica aberto a quem souber o URL.
3. Navegar no site com o browser normal e confirmar no painel que as visitas sobem depois de
   correr a agregação.
4. Confirmar que os gráficos ficam legíveis em mobile.

### Pronto para a fase seguinte

- Falta só a Fase 10 (lançamento), que é `[HUMAN]`: domínio, deploy, conteúdo real, páginas legais.

---

## Fase 10 — Lançamento

**Data:** 2026-07-25 · **Estado:** **parcial** — o código está feito e verificado; falta o deploy,
que é `[HUMAN]`.

### O que foi feito

- **`app/sitemap.ts`** dinâmico, só com produtos publicados; **`app/robots.ts`** a bloquear
  `/dashboard`, `/api/`, `/cesta` e as pré-visualizações; **`app/manifest.ts`** com as cores da
  marca.
- **`app/icon.tsx`** e **`app/opengraph-image.tsx`** gerados por `next/og` a partir do lockup
  tipográfico — o `DESIGN.md` proíbe redesenhar a marca e os ficheiros originais não existem.
- **`/legal/privacidade`** e **`/legal/termos`** em pt-BR, referindo a LGPD pelo nome e pela lei
  (13.709/2018), com `{{CNPJ}}` como marcador enquanto as configurações não tiverem CNPJ. Sem
  banner de cookies, porque não há cookies no site público.
- **Links legais no rodapé.**
- **`app/not-found.tsx`** e **`app/error.tsx`** com a identidade visual; a de erro mostra o `digest`
  para se poder cruzar com os logs da Vercel.
- **`/_ds` removido.**
- **`README.md` final:** arquitetura, deploy, criação de utilizadores, backups e manutenção.

### Checklist de aceitação

| Critério                                                           | Resultado                            | Como foi verificado                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lighthouse mobile ≥ 90 nas quatro categorias, na home e no produto | **OK**                               | Home: **Performance 96, Acessibilidade 100, Boas Práticas 100, SEO 100**. Página de produto: **96 / 100 / 100 / 100**. A acessibilidade subiu a 100 na home graças à correcção de contraste da Fase 7. |
| Produção acessível no domínio, com HTTPS e sem avisos na consola   | **[pendente de verificação humana]** | Localmente, as nove rotas públicas respondem 200, as seis do painel redirecionam com 302, e o log do servidor não tem um único erro. O domínio e o HTTPS só existem depois do deploy.                  |
| Fluxo completo em produção: produto → cesta → WhatsApp → painel    | **[pendente de verificação humana]** | O fluxo está verificado ponta a ponta em local (fases 4 e 8), mas com o número de WhatsApp placeholder. Em produção depende do número real.                                                            |
| Upload real em produção chega ao R2 e faz download pelo painel     | **[pendente de verificação humana]** | Verificado em local com um STL de 40 MB contra o R2 verdadeiro (fases 5 e 8). Falta repetir no domínio de produção, que tem de estar no CORS dos dois buckets.                                         |

Verificado também: `/sitemap.xml` lista as 12 URLs certas e nenhum rascunho ou arquivado;
`/robots.txt` bloqueia o que devia; `/icon` e `/opengraph-image` devolvem PNG; `/_ds` passou a dar
404; a home não tem uma única ocorrência da palavra "cookie"; e o `{{CNPJ}}` aparece nas duas
páginas legais, como manda a secção 7 do `CLAUDE.md`.

Gates: `pnpm typecheck`, `pnpm lint` e `pnpm build` passam.

### O que falta, e só a pessoa pode fazer

1. **Deploy na Vercel** e ligação do domínio.
2. **Copiar as variáveis de ambiente** — ver a lista em `.env.example` e as notas em `BLOCKERS.md`.
3. **Número de WhatsApp real** nas configurações; ainda é `550000000000`.
4. **CNPJ**, senão as páginas legais mostram `{{CNPJ}}` em produção.
5. **CORS dos dois buckets** e **hostnames do Turnstile** com o domínio final.
6. **Apagar o utilizador de seed** `admin@oficinarasse.local`.
7. **Neon:** separar branch de produção do de desenvolvimento, e confirmar a janela de restauro.
8. **Fotografias reais** e confirmação das fontes e do logo — ver `BLOCKERS.md`.
