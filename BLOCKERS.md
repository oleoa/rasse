# BLOCKERS.md — Oficina Rassë

Registro de bloqueios: segredos faltando, decisões humanas pendentes, dependências fora da lista
do `CLAUDE.md`, e divergências entre o `PLAN.md` e o `CLAUDE.md`.

Formato: `## [Fase N] Título` → o que falta, porque bloqueia, e qual a alternativa reversível
escolhida entretanto.

---

## [Fase 1] `event_daily` não pode ter PK `(date, type, product_id)` — divergência resolvida

**O quê:** a seção 5 do `CLAUDE.md` especifica `event_daily` com `PK (date, type, product_id)`,
mas `product_id` é anulável (eventos como `page_view` não têm produto) e o Postgres exige
`NOT NULL` em todas as colunas de uma chave primária.

**Alternativa escolhida:** constraint `UNIQUE NULLS NOT DISTINCT ("date","type","product_id")`
com o nome `event_daily_pk`. Dá exatamente a semântica pretendida — duas linhas com o mesmo
`(date, type, NULL)` são consideradas duplicadas e rejeitadas — e serve de alvo para o
`ON CONFLICT` da agregação idempotente da Fase 9. Requer Postgres 15+; o Neon deste projeto roda
o 18.4.

**Reversível:** sim. Trocar para uma PK real exigiria um `product_id` sentinela, que é pior.

**Ação humana necessária:** nenhuma. Fica registrado por ser um desvio ao texto do `CLAUDE.md`.

---

## [Fase 1] Número de WhatsApp do `settings` é um placeholder

**O quê:** o seed grava `whatsapp_number = "550000000000"`, que é deliberadamente inválido. O
número real da oficina nunca foi fornecido e o `CLAUDE.md` proíbe inventar dados de negócio.

**Impacto:** os links `wa.me` gerados na Fase 4 não abrem uma conversa real até o número ser
preenchido. Não bloqueia o desenvolvimento — o formato do link é verificável na mesma.

**Ação humana necessária:** fornecer o número no formato internacional sem símbolos
(ex.: `5511987654321`), para salvar em `settings.whatsapp_number` pelo dashboard (Fase 7) ou por
`UPDATE` direto. Precisa estar correto antes da Fase 10.

---

## [Fase 1] CNPJ e email de contato por preencher

**O quê:** `settings.cnpj` e `settings.contact_email` ficaram a `NULL`. A seção 7 do `CLAUDE.md`
manda deixar o placeholder visível `{{CNPJ}}` em vez de inventar dados.

**Ação humana necessária:** fornecer CNPJ e email antes das páginas legais da Fase 10. Até lá,
as páginas mostram `{{CNPJ}}`.

---

## [Fase 1] `bcryptjs` em vez de `bcrypt` nativo

**O quê:** a seção 6 do `CLAUDE.md` pede bcrypt com 12 rounds, sem indicar o pacote. Foi
instalado `bcryptjs` (implementação pura em JavaScript) e não `bcrypt` (binding nativo em C++).

**Por quê:** o `bcrypt` nativo precisa de compilação por plataforma e falha com frequência nos
builds da Vercel; o `bcryptjs` é o que a documentação do Auth.js v5 recomenda para o Next.js. O
algoritmo e o custo (12 rounds) são os mesmos, e os hashes são intermutáveis.

**Ação humana necessária:** nenhuma, a não ser que você prefira o binding nativo.

---

## [Fase 2] Fontes reais da marca por confirmar

**O quê:** o `DESIGN.md` (seção 7) diz que Playfair Display, Oswald e Lora são aproximações do
Google Fonts, não as fontes originais da Rassë. Foram essas as carregadas, via `next/font`.

**Impacto:** a identidade tipográfica está próxima mas não é a real. Trocar depois é barato — as
três fontes entram por três variáveis CSS (`--font-display`, `--font-accent`, `--font-body`) em
`app/globals.css` e por `app/layout.tsx`.

**Ação humana necessária:** confirmar as fontes reais, ou aceitar as aproximações. Se forem
arquivos licenciados, entregá-los para `next/font/local`.

---

## [Fase 2] Logo da marca faltando

**O quê:** o `DESIGN.md` avisa que só existem recortes de baixa resolução do Instagram e proíbe
redesenhar a marca. O header e o footer usam por isso o lockup tipográfico "RASSË" em
`--font-display`, não uma imagem.

**Ação humana necessária:** fornecer o logo em SVG ou PNG de alta resolução. Enquanto não houver,
o lockup tipográfico fica — é uma solução legítima, não um placeholder partido.

---

## [Fase 2] Ícones: adição ao DESIGN.md, assinalada

**O quê:** o `DESIGN.md` diz que a marca não tem sistema de ícones e que, sendo inevitável, se use
Lucide com traço 1.5px "sinalizando como adição". O `PLAN.md` pede explicitamente um ícone de
cesta no header.

**Onde:** apenas dois ícones, ambos com `strokeWidth={1.5}` — `ShoppingBasket` em
`components/public/cart-link.tsx` e `Menu` em `components/public/mobile-nav.tsx`.

**Ação humana necessária:** nenhuma, a não ser que você prefira o header só com tipografia
("CESTA (2)"), que é o que o `DESIGN.md` favorece.

---

## [Fase 2] Fotografia real da oficina faltando

**O quê:** o `DESIGN.md` manda usar fotos reais e, enquanto não houver, placeholders neutros com
legenda em monospace. Era o que estava em `public/seed/` (10 SVGs com o texto "FOTO: …").

**Atualização (2026-07-25):** os 10 SVGs foram substituídos por **fotografias de banco de imagens**
(Unsplash, licença livre para uso comercial e sem atribuição obrigatória), a pedido, para o
catálogo deixar de parecer um esqueleto em demonstrações. Continuam sob o prefixo `seed/`, que é
o que o `lib/images.ts` usa para distinguir demonstração de conteúdo real, e os textos `alt`
descrevem a foto que está lá — não o produto que ela finge ser.

**Risco se ficarem:** as fotos mostram tábuas e peças de terceiros. Num site que vende exatamente
esses itens, publicar assim anuncia um produto diferente do que será entregue. São para
demonstração, não para o lançamento.

**Ação humana necessária:** fornecer fotografia da oficina e das peças **antes do lançamento**.
Para trocar: colocar os arquivos em `public/seed/` (ou enviar pelo painel, em cada produto),
ajustar `db/seed-data.ts` e rodar `pnpm db:imagens`.

**Atualização (landing page):** a landing desenhada no Claude Design pede duas fotografias que
continuam ausente.

| Onde                      | Estado                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Hero da home (full-bleed) | `public/hero-montanha.jpg` — foto de stock de ZUMRAD NORMATOVA no Pexels, escolhida no desenho |
| Seção "A oficina" (4:5)   | `PhotoSlot` com legenda "Foto da oficina — bancada, madeira, gravação"                         |

A foto do hero é de stock e não mostra a oficina — é a escolha mais reversível (basta trocar o
arquivo) mas deve sair antes do lançamento. A licença do Pexels não exige atribuição; o crédito
fica registrado no cabeçalho de `components/public/home-hero.tsx`.

---

## [Fase 3] Renderizador de markdown escrito à mão

**O quê:** o `PLAN.md` pede "descrição em markdown renderizado", mas a lista de dependências do
`CLAUDE.md` não inclui nenhuma biblioteca de markdown. Instalar `react-markdown` seria sair da
lista sem autorização.

**Alternativa escolhida:** `lib/markdown.tsx`, um renderizador de um subconjunto que produz nós
React diretamente — títulos `#` a `###`, parágrafos, listas ordenadas e não ordenadas, negrito,
itálico, código inline e links http(s)/mailto. Nunca gera HTML a partir de string, por isso não
há superfície de XSS, ao contrário de um `dangerouslySetInnerHTML` com markdown convertido.

**O que não suporta:** HTML embutido, imagens, tabelas, citações, blocos de código com cercas,
listas encaixadas.

**Ação humana necessária:** autorizar `react-markdown` + `remark-gfm` se as descrições vierem a
precisar de tabelas ou imagens. Até lá, o subconjunto cobre o que o `seed.ts` usa.

---

## [Fase 3] Contraste do botão primário fica abaixo de AA

**O quê:** o `DESIGN.md` (seção 5) manda o botão primário ter fundo `--accent` (copper-500,
`#c07a30`) com texto `--cream-50` (`#f7f0e3`). Medido: **3,05:1**. O WCAG AA pede 4,5:1 para texto
normal e 3:1 para texto grande — passa apenas como texto grande. É a única auditoria de
acessibilidade que o Lighthouse falha em todo o site (na home, 96 em vez de 100).

**Nada foi alterado** — a cor da marca é decisão de quem desenhou, não minha.

**Duas saídas, ambas dentro da paleta do `DESIGN.md`:**

| Opção                                             | Contraste | Efeito visual                     |
| ------------------------------------------------- | --------- | --------------------------------- |
| Fundo `--copper-700` (`#7e4d15`) com `--cream-50` | 6,26:1    | botão mais escuro, menos vibrante |
| Texto `--char-900` (`#15100b`) sobre copper-500   | 5,46:1    | mantém o cobre, texto escuro      |

O resto da paleta passa folgadamente: corpo 13,24:1, texto esbatido 5,32:1, links 6,01:1.

**Ação humana necessária:** escolher uma das opções, ou aceitar 3,05:1 conscientemente. Precisa
ficar decidido antes da revisão de acessibilidade da Fase 10.

---

## [Fase 5] RESOLVIDO — credenciais do R2 e do Turnstile

Estava aqui o bloqueio que parou a execução autónoma. Foi levantado: o bucket `rasse` existe, as
credenciais estão no `.env.local`, a política de CORS foi aplicada por API, e o widget do Turnstile
está criado para `strutura.ai`. A Fase 5 foi concluída e verificada contra os serviços reais.

---

## [Fase 5] O widget do Turnstile só funciona em `strutura.ai`

**O quê:** o widget foi criado com o hostname `strutura.ai`, o que cobre esse domínio e todos os
subdomínios. Em `localhost` a Cloudflare retorna o erro `110200` (domínio não autorizado) — que é o
comportamento correto, não uma avaria.

**Consequência:** o desenvolvimento local usa as chaves de teste da Cloudflare, documentadas no
`README.md` e em comentário no `.env.local`. Elas chamam o `siteverify` verdadeiro, por isso o
caminho da recusa continua sendo testado a sério.

**Atenção:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` é embutida no bundle durante o `next build`. Trocar a
chave exige um build novo — reiniciar o servidor não chega.

**Ação humana necessária:** quando houver domínio próprio (`oficinarasse.com.br` ou outro),
acrescentá-lo aos hostnames do widget **e** à política de CORS do bucket.

---

## [Fase 5] Tabela `rate_limits` fora da seção 5 do CLAUDE.md — divergência

**O quê:** o `PLAN.md` exige rate limit por IP no endpoint de assinatura, e o critério de aceitação
é "10 submissões seguidas do mesmo IP são travadas". A seção 5 do `CLAUDE.md` não prevê nenhuma
tabela para isso.

**Por que uma tabela e não memória:** na Vercel cada invocação pode cair numa instância diferente,
e um contador em memória não é compartilhado nem sobrevive. Um limitador que não trava nada seria pior
do que não ter limitador, porque dá falsa segurança.

**Alternativa descartada:** Redis (Upstash) resolveria melhor, mas é uma dependência fora da lista
do `CLAUDE.md`. A tabela usa um único `INSERT ... ON CONFLICT`, é atômica, e as linhas velhas são
apagadas pelo `pnpm files:clean`.

**Ação humana necessária:** nenhuma. Fica registrado por ser um desvio ao schema declarado.

---

---

## [Fase 6] `AUTH_SECRET` gerado automaticamente

**O quê:** a Fase 6 estava marcada `[HUMAN]` por causa do `AUTH_SECRET`, mas não é uma conta nem um
serviço — são 32 bytes aleatórios. Foi gerado com `openssl rand -base64 32` e escrito no
`.env.local`, para não parar a execução por um segredo que qualquer um dos dois pode criar.

**Atenção no deploy:** a sessão é um JWT assinado com esta chave. O valor na Vercel precisa ser
**o mesmo** que está no `.env.local` se você quiser que as sessões sobrevivam; mudá-lo desliga toda a
gente. Guardá-lo num gerenciador de senhas é boa ideia — não há como recuperá-lo do `.env.local` se
o arquivo se perder.

**Ação humana necessária:** copiar o valor para as variáveis de ambiente da Vercel na Fase 10.

---

## [Fase 6] RESOLVIDO — usuário de seed apagado

**O quê:** existiam dois administradores. O de seed (`admin@oficinarasse.local`, com uma senha
fraca vinda do `.env.local`) foi **apagado do Neon** a 2026-07-25. Ficou apenas
`leonardo@strutura.ai`, criado pelo `pnpm user:create`.

**O que mudou no código:** o `db/seed.ts` deixou de criar usuários, e as variáveis
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` desapareceram do `.env.example` e do `.env.local`.
Administradores são criados só com `pnpm user:create`, que pede a senha no stdin — não fica em
arquivos nem no histórico da shell.

**Antes de apagar** confirmou-se que `leonardo@strutura.ai` autentica em produção
(`https://rasse.strutura.ai`), para não haver risco de ficar sem acesso ao painel.

---

## [Fase 7] Reordenação por botões em vez de arrastar

**O quê:** o `PLAN.md` pede reordenação de imagens por drag & drop. Foi feita com setas
("mover para trás" / "mover para a frente") e um botão de estrela para promover a capa.

**Por quê:** drag & drop acessível exige uma biblioteca (`dnd-kit` ou equivalente), que está fora da
lista de dependências do `CLAUDE.md`. As setas fazem exatamente o mesmo, funcionam com teclado e
com leitor de tela, e não trazem dependência nova. O mesmo vale para as variantes e as categorias.

**Ação humana necessária:** autorizar `dnd-kit` se o arrastar for mesmo importante. A estrutura de
dados (posição pela ordem do array) não muda.

---

## [Fase 8] Bucket privado criado — confirmar no painel da Cloudflare

**O quê:** foi criado o bucket **`rasse-privado`** pela API do R2, para os arquivos dos clientes.
O bucket `rasse` continua público (imagens de produto); o novo precisa continuar **sem acesso
público**, senão o problema volta.

**Por quê:** o acesso público no R2 é do bucket inteiro. Com tudo no mesmo bucket, os STL e
documentos enviados pelos clientes podiam ser baixados por qualquer pessoa que tivesse a URL.

**Ação humana necessária:**

1. No painel do R2, confirmar que `rasse-privado` tem _Public access_ **desativado**.
2. Acrescentar `R2_PRIVATE_BUCKET=rasse-privado` às variáveis de ambiente da Vercel.
3. A política de CORS já foi aplicada ao bucket novo por API; ao mudar de domínio, atualizar os
   dois buckets.

---

## [Fase 8] O token do R2 tem mais permissões do que precisa

**O quê:** ao criar o bucket privado percebeu-se que o token consegue **listar todos os buckets da
conta** (`aviadores-private`, `aviadores-public`, `crm`, `dran`, `laranja-resgate`, `oleoa`,
`rasse`, `studio`) e **criar buckets novos**. Ou seja, não está limitado ao projeto Rassë.

**Risco:** se este token vazar — está nas variáveis de ambiente da Vercel e no `.env.local` — dá
acesso a projetos que não têm nada a ver com este.

**Ação humana necessária:** criar um token novo com permissão _Object Read & Write_ limitada
apenas a `rasse` e `rasse-privado`, e substituir `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY`. O
código não precisa de mudar — só deixa de conseguir criar buckets, o que não é mais preciso.

---

## [Fase 9] `CRON_SECRET` precisa ir para a Vercel

**O quê:** foi gerado um `CRON_SECRET` e escrito no `.env.local`. O endpoint
`/api/cron/agregar` aceita o header `x-vercel-cron` (que a Vercel envia) ou
`Authorization: Bearer <CRON_SECRET>`.

**Risco se faltar:** sem o segredo definido em produção, o endpoint fica acessível a quem souber o
URL. Não apaga nada — só recalcula agregados — mas é trabalho de banco de dados de graça para
qualquer pessoa.

**Ação humana necessária:** copiar `CRON_SECRET` para as variáveis de ambiente da Vercel, e
confirmar na aba Cron que a agregação roda às 06:00 UTC (03:00 em São Paulo).

---

## [Pós-lançamento] INCIDENTE — `pnpm db:reset` corrido contra a base de produção

**Quando:** 2026-07-25, depois do deploy.

**O que aconteceu:** ao verificar que o seed não criava mais usuários, corri `pnpm db:reset`
contra o `.env.local` — que aponta para **a mesma base Neon que a produção usa**. O comando apagou
o schema `public` inteiro. Depois, num comando de teste mal escrito (um `||` que voltava rodando o
`db:drop`, e um `db:reset` sem guard), repeti o erro.

**O que se perdeu:**

| Dados                            | Estado                                                      |
| -------------------------------- | ----------------------------------------------------------- |
| Usuário `leonardo@strutura.ai`   | **Perdido e recriado**, com a mesma senha                   |
| Produtos, categorias, settings   | Recriados pelo seed, idênticos — não havia edições por cima |
| 5 cestas e 2 orçamentos de teste | Perdidos. Eram das verificações das fases 4, 5 e 8          |
| Eventos de analytics             | Perdidos. Eram de teste                                     |
| STL de 40 MB no R2               | Ficou órfão e foi apagado pelo `pnpm files:clean`           |

Nada de negócio real se perdeu, porque ainda não há nada de negócio real na base. Se isto tivesse
acontecido uma semana depois do lançamento, teria levado junto pedidos de clientes.

**Por que o guard não travou:** o `scripts/db-drop.ts` só recusava com `NODE_ENV=production`,
variável que nunca está definida ao rodar um script à mão. Protegia contra nada.

**O que foi corrigido:** o guard passou a olhar para o **conteúdo** do banco de dados. Se houver
linhas em `users`, `carts` ou `quote_requests` — tabelas que o seed nunca preenche — o comando
recusa, mostra as contagens e o host, e obriga a `--force`. Testado: com um usuário na base, o
`pnpm db:drop` recusa e a base fica intacta.

**Ação humana necessária:**

1. **Separar os bancos de dados.** O `.env.local` e a produção compartilham a mesma Neon. Criar um
   branch de desenvolvimento no Neon e apontar o `.env.local` para lá é o que impede de vez este
   tipo de acidente — o guard é uma rede, não uma solução.
2. **Mudar a senha de `leonardo@strutura.ai`.** Foi escolhida por mim durante os testes e
   usada em scripts de verificação fora do repositório — deve ser tratada como conhecida. Criar
   uma conta nova com `pnpm user:create` e apagar esta é o caminho mais limpo.

---

## [Fase 10] Migração `0002` pendente de aplicar — enum `request_status`

**O quê:** o valor `'contactado'` do enum `request_status` era português europeu e passou a
`'contatado'`. A migração `db/migrations/0002_ptbr_request_status.sql` faz o
`ALTER TYPE ... RENAME VALUE`, que renomeia o valor sem tocar nas linhas.

**Porque bloqueia:** o código já só conhece `'contatado'`. Enquanto a migração não rodar, mudar o
estado de um pedido ou de um orçamento falha no banco de dados.

**Ação humana necessária:**

1. `pnpm db:migrate` no ambiente de desenvolvimento.
2. Rodar a mesma migração contra o banco de produção antes do próximo deploy — o `.env.local` e a
   produção ainda compartilham a mesma Neon (ver o bloqueio do `db:drop`, acima), por isso confirme
   contra qual host está apontando antes de rodar.

**Reversível:** `ALTER TYPE "public"."request_status" RENAME VALUE 'contatado' TO 'contactado';`
