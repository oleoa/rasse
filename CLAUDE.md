# CLAUDE.md — Oficina Rassë

Contexto permanente para o Claude Code. Lê este ficheiro antes de qualquer alteração.

---

## 1. O projeto

Website da **Oficina Rassë**: oficina-ateliê que produz peças em impressão 3D e gravação/corte a laser
(tábuas, peças personalizadas, brindes). Público-alvo: clientes finais no Brasil.

O site tem duas partes:

- **Pública** — catálogo de produtos, página de produto, quem somos, formulário de pedido
  personalizado, e uma cesta que termina numa conversa de WhatsApp.
- **Dashboard privado** — CRUD de produtos, gestão de pedidos e orçamentos, métricas.

**Não há pagamento online, checkout, envio de email nem automações em v1.** Todo o fecho de
negócio acontece no WhatsApp do dono. Se uma tarefa parecer exigir pagamento ou email, está fora
de âmbito — regista em `BLOCKERS.md` e continua.

Idioma de todo o conteúdo visível: **português do Brasil**. Moeda: **BRL**, guardada em centavos.

---

## 2. Stack (versões fixas — não trocar)

| Camada            | Escolha                                       |
| ----------------- | --------------------------------------------- |
| Framework         | Next.js 15, App Router, TypeScript `strict`   |
| UI                | Tailwind CSS v4 + shadcn/ui                   |
| Base de dados     | Neon (Postgres serverless)                    |
| ORM / migrations  | Drizzle ORM + drizzle-kit                     |
| Storage           | Cloudflare R2 (S3 API, presigned URLs)        |
| Auth              | Auth.js (NextAuth v5), provider `credentials` |
| Validação         | Zod (todos os inputs, sem excepção)           |
| Formulários       | react-hook-form + `@hookform/resolvers/zod`   |
| Gráficos          | Recharts                                      |
| Anti-spam         | Cloudflare Turnstile                          |
| Estado da cesta   | Zustand com `persist` em `localStorage`       |
| Hosting           | Vercel                                        |
| Gestor de pacotes | pnpm                                          |

**Não instalar dependências fora desta lista sem perguntar primeiro.** Se achares que falta
alguma, escreve a justificação em `BLOCKERS.md` e usa a solução nativa entretanto.

---

## 3. Convenções de código

- **Server Components por defeito.** `"use client"` só quando há estado, evento ou API do browser.
- **Mutações via Server Actions**, nunca route handlers, excepto: presigned URLs do R2, endpoint
  de tracking, e o handler do Auth.js.
- **Zod em toda a fronteira**: Server Actions, route handlers, variáveis de ambiente (`lib/env.ts`
  valida no arranque e falha ruidosamente).
- **`any` é proibido.** `unknown` + narrowing quando necessário.
- Acesso à base de dados só através de `lib/queries/*` e `lib/mutations/*`. Componentes nunca
  importam `db` directamente.
- Dinheiro em **centavos, inteiro**. Nunca `float`. Formatação só na camada de apresentação, via
  `lib/format.ts` (`Intl.NumberFormat("pt-BR", { currency: "BRL" })`).
- Datas em UTC na base de dados; apresentação em `America/Sao_Paulo`.
- Nomes de ficheiros e pastas em `kebab-case`; componentes em `PascalCase`.
- Rotas públicas em português: `/produtos`, `/produtos/[slug]`, `/quem-somos`, `/personalizado`,
  `/cesta`. Dashboard: `/dashboard/...`.
- Sem comentários decorativos. Comenta apenas o que não é óbvio pelo código.
- Cada ficheiro faz uma coisa. Se passar de ~200 linhas, provavelmente faz duas.

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

Ids: `uuid` gerado na base de dados. Todas as tabelas têm `created_at`; as mutáveis têm `updated_at`.

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
  status: 'novo' | 'contactado' | 'fechado' | 'perdido',
  internal_notes, created_at, updated_at

cart_items
  id, cart_id -> carts (cascade),
  product_id -> products (set null),
  product_name_snapshot, variant_name_snapshot?,
  quantity, unit_price_cents_snapshot?,     -- null se 'on_request'
  personalization_text?

quote_requests                  -- pedido de impressão personalizada
  id, code (unique), name, contact, message,
  status: 'novo' | 'contactado' | 'fechado' | 'perdido',
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
2. **`code`** é a cola entre a base de dados e a conversa de WhatsApp. Gerado com alfabeto sem
   caracteres ambíguos (`0`, `O`, `1`, `I`, `l`), 8 caracteres, formato `RS-XXXXXXXX`. Nunca expor
   ids sequenciais nem uuids ao cliente.
3. **Produtos nunca são apagados**, apenas `archived`. O apagar só existe para rascunhos sem
   pedidos associados.
4. `price_cents` é `null` obrigatoriamente quando `price_type = 'on_request'` — validar em Zod e
   com check constraint.

---

## 6. Regras de negócio

**Cesta.** Vive só no browser (Zustand + localStorage) até o cliente clicar em enviar. Nesse
momento, uma Server Action cria `carts` + `cart_items`, gera o `code`, e devolve o link `wa.me`.
Não há carrinhos abandonados na base de dados.

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
subtotal. Se a cesta tiver algum destes itens, o total mostra-se como "Subtotal parcial".

**Pedido personalizado.** Campos: nome, contacto (WhatsApp ou email), mensagem livre, ficheiros.
Não perguntar quantidade, material, prazo nem orçamento — isso é tratado na conversa.

**Prazos de produção nunca aparecem no site.**

**Ficheiros.** Whitelist: `stl, 3mf, obj, step, stp, svg, dxf, ai, pdf, png, jpg, jpeg, webp`.
Máx. **50 MB** por ficheiro, **5 ficheiros** por pedido. Upload directo browser → R2 com presigned
URL (o body limit da Vercel não aguenta um STL). Validar extensão **e** mime no servidor antes de
assinar. Chaves em `quotes/{quote_code}/{uuid}.{ext}`. Retenção: 12 meses (script de limpeza).

**Analytics.** Sem cookies. `session_id` é um uuid em `sessionStorage`. Eventos gravados via
`POST /api/track` com `navigator.sendBeacon`. Ignorar tráfego autenticado no dashboard.

**Autenticação.** Só admins em v1, sem registo público. Utilizadores criados por script CLI.
Passwords com bcrypt (12 rounds). Middleware protege tudo o que esteja sob `/dashboard`.

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

- **Uma fase de cada vez.** Não começar a seguinte antes de commit da actual.
- **Não refactorizar** trabalho de fases anteriores sem necessidade da fase actual.
- **Não escrever dados fictícios de negócio** (preços, textos institucionais) fora do `seed.ts`.
- Se algo estiver ambíguo ou faltar um segredo, escrever em `BLOCKERS.md` e escolher a alternativa
  mais reversível — nunca ficar parado à espera.
- Segredos só em `.env.local`. `.env.example` sempre actualizado com as chaves e sem valores.
