# PLAN.md — Oficina Rassë

Plano de execução por fases. Cada fase é fechada, verificável e termina num commit.
Lê o `CLAUDE.md` antes de tocar em código. O progresso vive em `PROGRESS.md`.

Legenda: **[HUMAN]** = a fase precisa de segredos, contas ou decisão humana. Ao chegar a uma
destas, para e pede o que falta antes de continuar.

---

## Fase 0 — Fundações

**Objetivo:** repositório que compila, com todas as ferramentas ligadas e nada de negócio ainda.

- `create-next-app` com App Router, TypeScript, Tailwind v4, ESLint, pnpm, `src/` desactivado.
- `tsconfig.json` com `strict: true` e `noUncheckedIndexedAccess: true`.
- shadcn/ui inicializado (`components/ui`), tema base neutro (o real entra na Fase 2).
- Prettier + `prettier-plugin-tailwindcss`. Scripts: `dev`, `build`, `start`, `lint`, `typecheck`,
  `format`, `db:generate`, `db:migrate`, `db:seed`, `db:studio`.
- Drizzle + `@neondatabase/serverless` configurados; `db/index.ts` exporta o cliente.
- `lib/env.ts`: schema Zod das variáveis de ambiente, validado no arranque.
- `.env.example`, `.gitignore`, `README.md` (como correr localmente), `PROGRESS.md`, `BLOCKERS.md`.
- Estrutura de pastas da secção 4 do `CLAUDE.md`, com `.gitkeep` onde for preciso.

**Aceitação**

- [ ] `pnpm typecheck && pnpm lint && pnpm build` passam.
- [ ] `pnpm dev` serve a página inicial sem erros na consola.
- [ ] `lib/env.ts` falha com mensagem clara se faltar `DATABASE_URL`.
- [ ] Nenhum segredo commitado.

---

## Fase 1 — Schema e dados **[HUMAN]** (precisa de `DATABASE_URL` do Neon)

**Objetivo:** base de dados a espelhar a secção 5 do `CLAUDE.md`.

- `db/schema.ts` completo, com enums Postgres, índices (`products.slug`, `carts.code`,
  `quote_requests.code`, `events.created_at`, `events.product_id`) e check constraints
  (`price_cents` null sse `price_type = 'on_request'`).
- Migration inicial gerada e aplicada.
- `lib/code.ts`: geração de `code` com alfabeto sem ambiguidades + verificação de colisão.
- `db/seed.ts`: `settings` (número de WhatsApp placeholder), 1 utilizador admin, 3 categorias,
  8 produtos inspirados no catálogo real (tábuas de churrasco, tábuas gravadas com nome de
  família, peças 3D), sendo pelo menos 2 com variantes, 2 com personalização e 1 `on_request`.
  Imagens: placeholders locais em `/public/seed`.
- `pnpm db:reset` — apaga, migra e faz seed.

**Aceitação**

- [ ] `pnpm db:reset` corre duas vezes seguidas sem erro.
- [ ] Tentar inserir produto `on_request` com preço é rejeitado pela base de dados.
- [ ] Query de um produto devolve categoria, imagens e variantes com tipos corretos.

---

## Fase 2 — Design system e layout

**Objetivo:** aplicar o design system e ter o esqueleto visual do site.

- Importar os tokens do Claude Design (link em `DESIGN.md`; se ainda não existir, criar a partir
  do URL fornecido pelo humano) para CSS variables em `app/globals.css`, mapeadas para as
  variáveis do shadcn (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, …).
- Fontes via `next/font`, com fallbacks. Escala tipográfica e espaçamento no tema do Tailwind.
- Componentes de layout: `Header` (logo, navegação, ícone da cesta com contador), `Footer`,
  `Container`, `PageHeader`, `EmptyState`, `Skeleton` de produto.
- Modo claro/escuro só se o design system o definir; caso contrário, um só tema.
- Rota interna `/_ds` com todos os componentes e estados (não indexável, removível no fim).

**Aceitação**

- [ ] `/_ds` mostra botões, inputs, cards, badges, estados vazios e skeletons.
- [ ] Zero cores hardcoded em componentes — tudo por token.
- [ ] Header e footer responsivos a 375px, 768px e 1440px.

---

## Fase 3 — Páginas públicas

**Objetivo:** catálogo navegável e indexável, ainda sem cesta.

- **Home:** hero (`settings`), grelha de destaques (`is_featured`), bloco sobre a oficina,
  CTA para pedido personalizado.
- **`/produtos`:** grelha com filtro por categoria via query string, ordenação por `position`,
  estado vazio.
- **`/produtos/[slug]`:** galeria de imagens, nome, preço (ou "Sob consulta"), descrição em
  markdown renderizado, seletor de variante, campo de personalização (se aplicável), botão
  "Adicionar à cesta" (inerte nesta fase), produtos relacionados da mesma categoria.
- **`/quem-somos`:** conteúdo de `settings.about_md`.
- `generateStaticParams` + ISR (`revalidate: 60`); `revalidatePath` na Fase 7 ao guardar produtos.
- Metadata por página, Open Graph com a primeira imagem, JSON-LD `Product`.
- `next/image` com `remotePatterns` para o domínio do R2.
- 404 dedicado para produto inexistente ou não publicado.

**Aceitação**

- [ ] Produtos `draft` e `archived` dão 404 em rota directa e não aparecem em listagens.
- [ ] Preço formatado como `R$ 1.234,50`.
- [ ] Lighthouse mobile ≥ 90 em Performance, A11y, SEO na página de produto.
- [ ] Navegação por teclado completa; imagens com `alt`.

---

## Fase 4 — Cesta e envio para WhatsApp

**Objetivo:** o fluxo que gera receita. É a fase mais importante do projeto.

- Store Zustand com `persist`: `productId`, `variantId`, `quantity`, `personalizationText` e
  snapshot de nome/preço para render offline. Chave de linha = produto + variante + texto.
- Drawer da cesta a partir do header; página `/cesta` com a mesma informação.
- Alterar quantidade, remover linha, limpar cesta. Subtotal apenas de itens com preço fixo;
  "Subtotal parcial" quando existirem itens sob consulta.
- **Revalidação no servidor antes do envio:** a Server Action recarrega os produtos por id,
  ignora os que já não estão publicados (avisando o cliente), e usa os preços da base de dados —
  nunca os que vieram do browser.
- Server Action `createCartAndGetWhatsappUrl`: valida com Zod, cria `carts` + `cart_items` com
  snapshots, gera `code`, regista evento `cart_sent`, devolve `https://wa.me/<numero>?text=…`.
- Campo de nome opcional antes de enviar. Redirect em nova aba; ecrã de confirmação com o código
  visível e opção de copiar.
- Limpar a cesta local após envio bem-sucedido.

**Aceitação**

- [ ] Cesta sobrevive a refresh e a fechar o browser.
- [ ] Acentos e quebras de linha chegam corretos ao WhatsApp em iOS, Android e desktop.
- [ ] Produto despublicado entre a adição e o envio não parte o fluxo.
- [ ] Adulterar o preço no localStorage não altera o valor gravado na base de dados.
- [ ] A linha de `carts` só existe depois do clique de envio.

---

## Fase 5 — Pedido de impressão personalizada **[HUMAN]** (precisa de R2 e Turnstile)

**Objetivo:** receber ficheiros pesados sem passar pelo servidor.

- `lib/r2.ts`: cliente S3 e assinatura de URLs (`@aws-sdk/client-s3` + `s3-request-presigner`).
- `POST /api/uploads/presign`: valida extensão, mime e tamanho contra a whitelist, exige token
  Turnstile válido, rate limit por IP, devolve URL assinada com expiração de 5 minutos.
- CORS do bucket configurado para o domínio da aplicação (documentar em `README.md`).
- Formulário `/personalizado`: nome, contacto, mensagem, dropzone múltipla com barra de progresso
  por ficheiro, cancelar, remover, validação no cliente antes de pedir assinatura.
- Server Action final cria `quote_requests` + `quote_files` com as chaves já carregadas e regista
  `quote_submitted`. Ecrã de sucesso com o código do pedido e botão para abrir o WhatsApp.
- Ficheiros órfãos (upload feito, formulário nunca submetido) limpos por script.

**Aceitação**

- [ ] STL de ~40 MB chega ao R2; a Vercel nunca vê o corpo do ficheiro.
- [ ] `.exe` renomeado para `.stl` é rejeitado.
- [ ] Submeter sem Turnstile válido falha no servidor.
- [ ] 10 submissões seguidas do mesmo IP são travadas.

---

## Fase 6 — Autenticação e shell do dashboard **[HUMAN]** (`AUTH_SECRET`)

- Auth.js v5 com `credentials`, sessão em JWT, bcrypt (12 rounds).
- `middleware.ts` protege `/dashboard/*`; `/dashboard/login` público.
- Script `pnpm user:create` para criar admins pela linha de comandos.
- Layout do dashboard: sidebar (Visão geral, Produtos, Categorias, Pedidos, Orçamentos,
  Configurações), utilizador e logout, breadcrumbs, responsivo.
- Página `/dashboard` provisória com contadores simples.

**Aceitação**

- [ ] Aceder a `/dashboard/produtos` sem sessão redireciona para login e volta ao destino depois.
- [ ] Password errada não distingue "utilizador não existe" de "password inválida".
- [ ] Sessão persiste entre reinícios do servidor de desenvolvimento.

---

## Fase 7 — CRUD de produtos, categorias e configurações

- Lista de produtos com pesquisa, filtro por estado e categoria, paginação, acções em massa
  (publicar / arquivar).
- Formulário de produto: campos da secção 5, editor markdown com pré-visualização, geração de
  slug a partir do nome com verificação de unicidade, avisos de SEO.
- Imagens: upload para R2 (mesmo fluxo presigned), reordenação por drag & drop, definir capa,
  texto alternativo obrigatório, apagar. Chaves em `products/{product_id}/{uuid}.{ext}`.
- Variantes: adicionar, reordenar, `price_delta` positivo ou negativo.
- Categorias: CRUD com reordenação; impedir apagar categoria com produtos.
- Configurações: número de WhatsApp, textos do hero, `about_md`, links sociais, CNPJ.
- Todas as mutações via Server Actions com Zod partilhado entre cliente e servidor, seguidas de
  `revalidatePath` das rotas públicas afectadas.
- Pré-visualização de rascunho por token na URL.

**Aceitação**

- [ ] Criar → editar → publicar → arquivar sem recarregar a página manualmente.
- [ ] Publicar um produto reflete-se na listagem pública em menos de 5 segundos.
- [ ] Slug duplicado mostra erro no campo, não uma exceção.
- [ ] Apagar imagem remove o objeto do R2 e a linha da base de dados.

---

## Fase 8 — Pedidos e orçamentos (o dia-a-dia dele)

- `/dashboard/pedidos`: lista de cestas com código, data, nome, nº de itens, subtotal, estado.
  Filtro por estado, pesquisa por código.
- `/dashboard/pedidos/[code]`: itens com nome, variante, texto de personalização, quantidade e
  preço; total; mudar estado; notas internas com gravação automática.
- `/dashboard/orcamentos` e `/dashboard/orcamentos/[code]`: mensagem completa, lista de ficheiros
  com tamanho, ícone por tipo e download por URL assinado (expira em 15 min), pré-visualização
  para imagens, mesmo fluxo de estado e notas.
- Botão que abre o WhatsApp do cliente já com o código do pedido na mensagem, quando o contacto
  for um número.
- Badge de "novos" na sidebar.

**Aceitação**

- [ ] Um pedido criado na Fase 4 aparece aqui com todos os snapshots intactos.
- [ ] Download de ficheiro sem sessão activa é negado.
- [ ] Mudança de estado persiste após refresh.

---

## Fase 9 — Analytics

- `POST /api/track`: Zod, `sendBeacon`, sem cookies, ignora sessões autenticadas e bots óbvios,
  rate limit generoso por IP.
- Eventos: `page_view`, `product_view`, `add_to_cart`, `cart_sent`, `quote_submitted`.
- Agregação diária para `event_daily` (Vercel Cron às 03:00 `America/Sao_Paulo`), idempotente.
- `/dashboard` com: visitas por dia (30 dias), top 10 produtos mais vistos, top 10 mais
  adicionados à cesta, cestas enviadas por semana, orçamentos por semana, e taxa
  `add_to_cart → cart_sent`. Seletor de período: 7 / 30 / 90 dias.
- Gráficos Recharts com estados vazios e de carregamento.

**Aceitação**

- [ ] Números dos gráficos batem certo com `SELECT count(*)` sobre `events`.
- [ ] Correr a agregação duas vezes para o mesmo dia não duplica valores.
- [ ] Navegar no dashboard não gera eventos.

---

## Fase 10 — Lançamento **[HUMAN]** (domínio, deploy, conteúdo real)

- `sitemap.xml` dinâmico, `robots.txt`, `manifest`, favicons, imagem OG por defeito.
- Páginas `/legal/privacidade` e `/legal/termos` em pt-BR referindo a LGPD, com `{{CNPJ}}` como
  placeholder se não houver dados. Links no footer.
- Páginas de erro 404 e 500 com identidade visual.
- Remover `/_ds` e qualquer dado de seed do ambiente de produção.
- Deploy na Vercel, variáveis de ambiente, domínio, R2 com domínio próprio.
- Neon: branch de produção e de staging, backups verificados.
- Scripts de manutenção: limpeza de ficheiros órfãos e retenção de 12 meses.
- Revisão final: acessibilidade (contraste, foco, labels), meta tags, 404s, links de WhatsApp
  com o número real.
- `README.md` final: arquitetura, como fazer deploy, como criar utilizadores, como fazer backup.

**Aceitação**

- [ ] Produção acessível no domínio, com HTTPS e sem avisos na consola.
- [ ] Fluxo completo testado em produção: ver produto → cesta → WhatsApp → aparecer no dashboard.
- [ ] Upload de ficheiro real em produção chega ao R2 e faz download pelo dashboard.
- [ ] Lighthouse mobile ≥ 90 nas quatro categorias, na home e na página de produto.
