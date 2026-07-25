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
- Um banco de dados Neon (Postgres)

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local   # preencher DATABASE_URL
pnpm dev
```

A aplicação fica em http://localhost:3000.

Se faltar `DATABASE_URL`, a inicialização falha com uma mensagem explícita — a validação vive em
[lib/env.ts](lib/env.ts) e roda na inicialização via [instrumentation.ts](instrumentation.ts).

## Scripts

| Comando            | O que faz                                            |
| ------------------ | ---------------------------------------------------- |
| `pnpm dev`         | Servidor de desenvolvimento (Turbopack)              |
| `pnpm build`       | Build de produção                                    |
| `pnpm start`       | Servir o build de produção                           |
| `pnpm lint`        | ESLint                                               |
| `pnpm typecheck`   | `tsc --noEmit`                                       |
| `pnpm format`      | Prettier em todo o repositório                       |
| `pnpm db:generate` | Gera migrations a partir de `db/schema.ts`           |
| `pnpm db:migrate`  | Aplica migrations pendentes                          |
| `pnpm db:seed`     | Popula o banco de dados com dados de desenvolvimento |
| `pnpm db:drop`     | Apaga o schema `public` (recusa em produção)         |
| `pnpm db:reset`    | `db:drop` + `db:migrate` + `db:seed`                 |
| `pnpm db:studio`   | Abre o Drizzle Studio                                |
| `pnpm files:clean` | Limpa arquivos órfãos e fora da retenção (simula)    |
| `pnpm user:create` | Cria um administrador do painel                      |

Antes de dar qualquer fase por concluída: `pnpm typecheck && pnpm lint && pnpm build`.

## Banco de dados

O schema vive em [db/schema.ts](db/schema.ts) e é a fonte de verdade. Depois de o alterar:

```bash
pnpm db:generate   # escreve a migration em db/migrations/
pnpm db:migrate    # aplica-a
```

`pnpm db:reset` apaga o schema `public` inteiro antes de migrar e fazer seed — usar só em
desenvolvimento. **O seed não cria usuários**: administradores são sempre criados com
`pnpm user:create`, para não haver senhas em arquivos de configuração.

> **O `db:drop` se recusa a rodar** se encontrar linhas em `users`, `carts` ou `quote_requests` —
> tabelas que o seed nunca preenche. É o sinal de que a base está em uso a sério. Para insistir,
> `pnpm db:reset --force`. Este guard existe porque a alternativa (`NODE_ENV=production`) não
> protege nada quando se roda um script à mão.

## Arquivos (Cloudflare R2)

O upload do formulário de orçamento vai **direto do navegador para o bucket**, com uma URL assinada
pedido a `POST /api/uploads/presign`. O corpo do arquivo nunca passa pela Vercel — um STL de
40 MB estouraria o limite de corpo das funções.

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

Cada domínio novo precisa ser acrescentado aqui, senão o navegador bloqueia o upload.

Chaves: `quotes/{codigo_do_pedido}/{uuid}.{ext}`. A limpeza de arquivos órfãos (upload feito,
formulário nunca submetido) e a retenção de 12 meses estão em `pnpm files:clean`, que por padrão
só simula — `pnpm files:clean --apply` é que apaga.

## Anti-spam (Cloudflare Turnstile)

O widget protege `POST /api/uploads/presign` e a submissão do orçamento. Sem ele, qualquer pessoa
podia pedir URLs assinadas e encher o bucket à custa do dono.

**Em desenvolvimento local, usa as chaves de teste da Cloudflare.** O widget real está preso aos
hostnames configurados no painel; em `localhost` retorna o erro `110200` (domínio não autorizado).

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

O painel vive em `/dashboard` e está fechado por `middleware.ts`. Não há registro público: os
administradores são criados pela linha de comando.

```bash
pnpm user:create                              # pergunta e-mail, nome e senha
pnpm user:create -- --email=a@b.c --name=Ana  # a senha continua sendo pedida
```

A senha nunca passa por argumento nem por variável de ambiente, para não ficar no histórico da
shell. Mínimo de 10 caracteres, guardada com bcrypt a 12 rounds.

A sessão é um JWT assinado com `AUTH_SECRET`. **O valor precisa ser o mesmo em todos os ambientes de
um mesmo deploy** — mudá-lo invalida todas as sessões ativas.

## Arquitetura em duas linhas

O site público é estático com ISR de 60 segundos, e as mutações do painel fazem `revalidatePath`
das rotas afetadas — por isso publicar um produto aparece no catálogo em segundos, sem esperar
pelo relógio. Nada do que vem do navegador é aceite como verdade: preços, nomes e disponibilidade são
sempre recarregados do banco de dados antes de salvar.

| Camada          | Onde vive                                                               |
| --------------- | ----------------------------------------------------------------------- |
| Público         | `app/(public)/` — catálogo, cesta, orçamento, legal                     |
| Painel          | `app/(dashboard)/` — fechado por `middleware.ts`                        |
| Login           | `app/(auth)/dashboard/login/` — fora do ramo protegido, senão era ciclo |
| Leitura da BD   | `lib/queries/` — nenhum componente importa `db` diretamente             |
| Escrita da BD   | `lib/mutations/` — Server Actions com Zod                               |
| Regras de dados | `db/schema.ts` — enums, índices e check constraints                     |

## Deploy na Vercel

1. Ligar o repositório à Vercel. O `pnpm build` já é o comando certo.
2. Copiar **todas** as variáveis de `.env.example` para as variáveis de ambiente do projeto.
   Atenção às que precisam ser iguais entre ambientes: `AUTH_SECRET` (mudá-la desliga todas as
   sessões) e `CRON_SECRET`.
3. `NEXT_PUBLIC_SITE_URL` precisa apontar para o domínio final — é o que alimenta o `sitemap.xml`,
   o `robots.txt` e as metatags Open Graph.
4. Acrescentar o domínio novo à política de CORS dos **dois** buckets do R2 e aos hostnames do
   widget Turnstile.
5. O cron da agregação está em `vercel.json` e roda às 06:00 UTC (03:00 em São Paulo).

> As variáveis `NEXT_PUBLIC_*` são embutidas no bundle durante o build. Mudá-las obriga a um novo
> deploy — reiniciar não chega.

## Criar usuários

```bash
pnpm user:create
```

Não há registro público. Ver a seção _Painel_, acima.

## Backups

O Neon guarda histórico e permite restaurar por _point-in-time_ dentro da janela do plano. Antes de
qualquer migração destrutiva, criar um branch do Neon a partir do estado atual — é instantâneo e
serve de rede de segurança. Nunca rodar `pnpm db:reset` contra produção: apaga o schema `public`
inteiro.

Os arquivos dos clientes vivem no bucket privado do R2 e não têm backup automático. Se forem
críticos, ativar versionamento no bucket.

## Manutenção

```bash
pnpm files:clean            # mostra o que apagaria
pnpm files:clean --apply    # apaga órfãos com mais de 24h e arquivos com mais de 12 meses
```

## Ambiente

Todas as variáveis estão listadas em [.env.example](.env.example), sem valores. Os segredos vivem
apenas em `.env.local` (ignorado pelo git) e nas variáveis de ambiente da Vercel.
