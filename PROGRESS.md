# PROGRESS.md — Oficina Rassë

Estado de execução do `PLAN.md`. Uma entrada por fase, com checklist de aceitação verificada
item a item e o que fica pendente de verificação humana.

| Fase                                     | Estado      | Data       |
| ---------------------------------------- | ----------- | ---------- |
| 0 — Fundações                            | concluída   | 2026-07-24 |
| 1 — Schema e dados                       | concluída   | 2026-07-25 |
| 2 — Design system e layout               | concluída   | 2026-07-25 |
| 3 — Páginas públicas                     | concluída   | 2026-07-25 |
| 4 — Cesta e envio para WhatsApp          | concluída   | 2026-07-25 |
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
