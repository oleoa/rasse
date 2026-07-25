# CLAUDE.md — Oficina Rassë

Contexto permanente para o Claude Code. Leia este arquivo antes de qualquer alteração.

---

## 1. O projeto

Website da **Oficina Rassë**: oficina-ateliê que produz peças em impressão 3D e gravação/corte a laser
(tábuas, peças personalizadas, brindes). Público-alvo: clientes finais no Brasil.

O site tem duas partes:

- **Pública** — catálogo de produtos, página de produto, quem somos, formulário de pedido
  personalizado, e uma cesta que termina numa conversa de WhatsApp.
- **Dashboard privado** — CRUD de produtos, gestão de pedidos e orçamentos, métricas.

**Não há pagamento online, checkout, envio de email nem automações em v1.** Todo o fechamento de
negócio acontece no WhatsApp do dono. Se uma tarefa parecer exigir pagamento ou email, está fora
do escopo — registre em `BLOCKERS.md` e continue.

Idioma de **tudo**: português do Brasil. Não só o conteúdo visível — também comentários, mensagens
de erro, nomes de variáveis em português, documentação e mensagens de commit. Nada de português
europeu: é _arquivo_ e não _ficheiro_, _usuário_ e não _utilizador_, _tela_ e não _ecrã_, _banco de
dados_ e não _base de dados_, _salvar_ e não _guardar_, _você_ e não _tu_ ("envie", nunca "envia").
Moeda: **BRL**, armazenada em centavos.

---

## 2. Stack (versões fixas — não trocar)

| Camada                 | Escolha                                       |
| ---------------------- | --------------------------------------------- |
| Framework              | Next.js 15, App Router, TypeScript `strict`   |
| UI                     | Tailwind CSS v4 + shadcn/ui                   |
| Banco de dados         | Neon (Postgres serverless)                    |
| ORM / migrations       | Drizzle ORM + drizzle-kit                     |
| Storage                | Cloudflare R2 (S3 API, presigned URLs)        |
| Auth                   | Auth.js (NextAuth v5), provider `credentials` |
| Validação              | Zod (todos os inputs, sem exceção)            |
| Formulários            | react-hook-form + `@hookform/resolvers/zod`   |
| Gráficos               | Recharts                                      |
| Anti-spam              | Cloudflare Turnstile                          |
| Estado da cesta        | Zustand com `persist` em `localStorage`       |
| Hosting                | Vercel                                        |
| Gerenciador de pacotes | pnpm                                          |

**Não instalar dependências fora desta lista sem perguntar primeiro.** Se achar que falta
alguma, escreva a justificativa em `BLOCKERS.md` e use a solução nativa enquanto isso.

---

## 3. Convenções de código

- **Server Components por padrão.** `"use client"` só quando há estado, evento ou API do navegador.
- **Mutações via Server Actions**, nunca route handlers, exceto: presigned URLs do R2, endpoint
  de tracking, e o handler do Auth.js.
- **Zod em toda a fronteira**: Server Actions, route handlers, variáveis de ambiente (`lib/env.ts`
  valida na inicialização e falha ruidosamente).
- **`any` é proibido.** `unknown` + narrowing quando necessário.
- Acesso ao banco de dados só através de `lib/queries/*` e `lib/mutations/*`. Componentes nunca
  importam `db` diretamente.
- Dinheiro em **centavos, inteiro**. Nunca `float`. Formatação só na camada de apresentação, via
  `lib/format.ts` (`Intl.NumberFormat("pt-BR", { currency: "BRL" })`).
- Datas em UTC no banco de dados; apresentação em `America/Sao_Paulo`.
- Nomes de arquivos e pastas em `kebab-case`; componentes em `PascalCase`.
- Rotas públicas em português: `/produtos`, `/produtos/[slug]`, `/quem-somos`, `/personalizado`,
  `/cesta`. Dashboard: `/dashboard/...`.
- Sem comentários decorativos. Comente apenas o que não é óbvio pelo código.
- Cada arquivo faz uma coisa. Se passar de ~200 linhas, provavelmente faz duas.

## 4. Estrutura de pastas

```
app/
  (public)/            layout público (header, footer)
    page.tsx           home
    produtos/
    quem-somos/
    personalizado/
    cesta/
    legal/
  (dashboard)/
    dashboard/         layout privado, protegido por middleware
  api/
    uploads/           presigned URLs do R2
    track/             ingestão de eventos
    auth/[...nextauth]/
components/
  ui/                  shadcn (não editar à mão sem motivo)
  public/
  dashboard/
db/
  schema.ts            fonte de verdade do schema
  migrations/
  seed.ts
lib/
  queries/  mutations/  env.ts  format.ts  r2.ts  whatsapp.ts  auth.ts  code.ts
```

---

## 5. Schema (fonte de verdade — `db/schema.ts`)

Ids: `uuid` gerado no banco de dados. Todas as tabelas têm `created_at`; as mutáveis têm `updated_at`.

```
settings            singleton (id=1)
  whatsapp_number, business_name, hero_title, hero_subtitle,
  instagram_url, about_md, cnpj?, contact_email?

users
  id, email (unique), password_hash, name, created_at

categories
  id, slug (unique), name, position

products
  id, slug (unique), name, short_description, description_md,
  category_id -> categories,
  price_type: 'fixed' | 'on_request',
  price_cents (null quando 'on_request'),
  status: 'draft' | 'published' | 'archived',
  is_featured, position,
  allows_personalization (bool),
  personalization_label,        -- ex: "Texto para gravação"
  personalization_help,         -- ex: "Máx. 30 caracteres"
  variant_group_label,          -- ex: "Tamanho" (null = sem variantes)
  seo_title, seo_description,
  created_at, updated_at

product_images
  id, product_id -> products (cascade), r2_key, alt, width, height, position

product_variants                -- eixo único, v1
  id, product_id -> products (cascade), name, price_delta_cents, position

carts                           -- criada SÓ no momento do envio para WhatsApp
  id, code (unique, curto), customer_name?,
  subtotal_cents,               -- soma apenas dos itens de preço fixo
  has_on_request_items (bool),
  status: 'novo' | 'contatado' | 'fechado' | 'perdido',
  internal_notes, created_at, updated_at

cart_items
  id, cart_id -> carts (cascade),
  product_id -> products (set null),
  product_name_snapshot, variant_name_snapshot?,
  quantity, unit_price_cents_snapshot?,     -- null se 'on_request'
  personalization_text?

quote_requests                  -- pedido de impressão personalizada
  id, code (unique), name, contact, message,
  status: 'novo' | 'contatado' | 'fechado' | 'perdido',
  internal_notes, created_at, updated_at

quote_files
  id, quote_request_id -> quote_requests (cascade),
  r2_key, filename, mime, size_bytes, created_at

events
  id, type: 'page_view' | 'product_view' | 'add_to_cart' | 'cart_sent' | 'quote_submitted',
  product_id?, session_id, path, referrer?, created_at

event_daily                     -- agregação, PK (date, type, product_id)
  date, type, product_id?, count
```

### Regras invioláveis do schema

1. **Snapshots.** `cart_items` guarda nome e preço no momento do envio. Alterar ou apagar um
   produto nunca pode alterar um pedido antigo.
2. **`code`** é a cola entre o banco de dados e a conversa de WhatsApp. Gerado com alfabeto sem
   caracteres ambíguos (`0`, `O`, `1`, `I`, `l`), 8 caracteres, formato `RS-XXXXXXXX`. Nunca expor
   ids sequenciais nem uuids ao cliente.
3. **Produtos nunca são apagados**, apenas `archived`. O apagar só existe para rascunhos sem
   pedidos associados.
4. `price_cents` é `null` obrigatoriamente quando `price_type = 'on_request'` — validar em Zod e
   com check constraint.

---

## 6. Regras de negócio

**Cesta.** Vive só no navegador (Zustand + localStorage) até o cliente clicar em enviar. Nesse
momento, uma Server Action cria `carts` + `cart_items`, gera o `code`, e retorna o link `wa.me`.
Não há carrinhos abandonados no banco de dados.

**Mensagem de WhatsApp.** Curta e sempre com o mesmo formato:

```
Olá! Tenho interesse nestes produtos:

• 2x Tábua Churrasco (Média)
• 1x Suporte 3D — a combinar

Código do pedido: RS-K7M4QP92
```

Nada de emojis. Encoding com `encodeURIComponent` sobre a string completa. Se a mensagem passar
de 1500 caracteres, corta a lista e escreve "…e mais N itens (ver pelo código)".

**Preço sob consulta.** Entra na cesta normalmente, aparece como "a combinar", não soma ao
subtotal. Se a cesta tiver algum destes itens, o total aparece como "Subtotal parcial".

**Pedido personalizado.** Campos: nome, contato (WhatsApp ou email), mensagem livre, arquivos.
Não perguntar quantidade, material, prazo nem orçamento — isso é tratado na conversa.

**Prazos de produção nunca aparecem no site.**

**Arquivos.** Whitelist: `stl, 3mf, obj, step, stp, svg, dxf, ai, pdf, png, jpg, jpeg, webp`.
Máx. **50 MB** por arquivo, **5 arquivos** por pedido. Upload direto navegador → R2 com presigned
URL (o body limit da Vercel não aguenta um STL). Validar extensão **e** mime no servidor antes de
assinar. Chaves em `quotes/{quote_code}/{uuid}.{ext}`. Retenção: 12 meses (script de limpeza).

**Analytics.** Sem cookies. `session_id` é um uuid em `sessionStorage`. Eventos registrados via
`POST /api/track` com `navigator.sendBeacon`. Ignorar tráfego autenticado no dashboard.

**Autenticação.** Só admins em v1, sem registro público. Usuários criados por script CLI.
Senhas com bcrypt (12 rounds). Middleware protege tudo o que esteja sob `/dashboard`.

---

## 7. Legal

Empresa brasileira → aplica-se a **LGPD**, não o RGPD. Páginas necessárias: Política de
Privacidade e Termos de Uso, escritas em pt-BR e referindo a LGPD. Sem cookies de tracking, logo
**sem banner de cookies** — não adicionar um. Se o dono não fornecer CNPJ, deixar placeholder
visível `{{CNPJ}}` em vez de inventar.

---

## 8. Definição de "feito"

Nenhuma fase está concluída sem, por esta ordem:

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint
pnpm build
```

Além disso: sem `TODO` por resolver no que foi escrito, sem `console.log` esquecido, sem `any`,
e todos os critérios de aceitação da fase em `PLAN.md` verificados um a um.

## 9. Regras de trabalho

- **Uma fase de cada vez.** Não começar a seguinte antes de commit da atual.
- **Não refatorar** trabalho de fases anteriores sem necessidade da fase atual.
- **Não escrever dados fictícios de negócio** (preços, textos institucionais) fora do `seed.ts`.
- Se algo estiver ambíguo ou faltar um segredo, escrever em `BLOCKERS.md` e escolher a alternativa
  mais reversível — nunca ficar parado esperando.
- Segredos só em `.env.local`. `.env.example` sempre atualizado com as chaves e sem valores.
