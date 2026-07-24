# BLOCKERS.md — Oficina Rassë

Registo de bloqueios: segredos em falta, decisões humanas pendentes, dependências fora da lista
do `CLAUDE.md`, e divergências entre o `PLAN.md` e o `CLAUDE.md`.

Formato: `## [Fase N] Título` → o que falta, porque bloqueia, e qual a alternativa reversível
escolhida entretanto.

---

## [Fase 1] `event_daily` não pode ter PK `(date, type, product_id)` — divergência resolvida

**O quê:** a secção 5 do `CLAUDE.md` especifica `event_daily` com `PK (date, type, product_id)`,
mas `product_id` é anulável (eventos como `page_view` não têm produto) e o Postgres exige
`NOT NULL` em todas as colunas de uma chave primária.

**Alternativa escolhida:** constraint `UNIQUE NULLS NOT DISTINCT ("date","type","product_id")`
com o nome `event_daily_pk`. Dá exactamente a semântica pretendida — duas linhas com o mesmo
`(date, type, NULL)` são consideradas duplicadas e rejeitadas — e serve de alvo para o
`ON CONFLICT` da agregação idempotente da Fase 9. Requer Postgres 15+; o Neon deste projeto corre
o 18.4.

**Reversível:** sim. Trocar para uma PK real exigiria um `product_id` sentinela, que é pior.

**Acção humana necessária:** nenhuma. Fica registado por ser um desvio ao texto do `CLAUDE.md`.

---

## [Fase 1] Número de WhatsApp do `settings` é um placeholder

**O quê:** o seed grava `whatsapp_number = "550000000000"`, que é deliberadamente inválido. O
número real da oficina nunca foi fornecido e o `CLAUDE.md` proíbe inventar dados de negócio.

**Impacto:** os links `wa.me` gerados na Fase 4 não abrem uma conversa real até o número ser
preenchido. Não bloqueia o desenvolvimento — o formato do link é verificável na mesma.

**Acção humana necessária:** fornecer o número no formato internacional sem símbolos
(ex.: `5511987654321`), para gravar em `settings.whatsapp_number` pelo dashboard (Fase 7) ou por
`UPDATE` directo. Tem de estar correcto antes da Fase 10.

---

## [Fase 1] CNPJ e email de contacto por preencher

**O quê:** `settings.cnpj` e `settings.contact_email` ficaram a `NULL`. A secção 7 do `CLAUDE.md`
manda deixar o placeholder visível `{{CNPJ}}` em vez de inventar dados.

**Acção humana necessária:** fornecer CNPJ e email antes das páginas legais da Fase 10. Até lá,
as páginas mostram `{{CNPJ}}`.

---

## [Fase 1] `bcryptjs` em vez de `bcrypt` nativo

**O quê:** a secção 6 do `CLAUDE.md` pede bcrypt com 12 rounds, sem indicar o pacote. Foi
instalado `bcryptjs` (implementação pura em JavaScript) e não `bcrypt` (binding nativo em C++).

**Porquê:** o `bcrypt` nativo precisa de compilação por plataforma e falha com frequência nos
builds da Vercel; o `bcryptjs` é o que a documentação do Auth.js v5 recomenda para o Next.js. O
algoritmo e o custo (12 rounds) são os mesmos, e os hashes são intermutáveis.

**Acção humana necessária:** nenhuma, a não ser que prefiras o binding nativo.

---

## [Fase 2] Fontes reais da marca por confirmar

**O quê:** o `DESIGN.md` (secção 7) diz que Playfair Display, Oswald e Lora são aproximações do
Google Fonts, não as fontes originais da Rassë. Foram essas as carregadas, via `next/font`.

**Impacto:** a identidade tipográfica está próxima mas não é a real. Trocar depois é barato — as
três fontes entram por três variáveis CSS (`--font-display`, `--font-accent`, `--font-body`) em
`app/globals.css` e por `app/layout.tsx`.

**Acção humana necessária:** confirmar as fontes reais, ou aceitar as aproximações. Se forem
ficheiros licenciados, entregá-los para `next/font/local`.

---

## [Fase 2] Logo da marca em falta

**O quê:** o `DESIGN.md` avisa que só existem recortes de baixa resolução do Instagram e proíbe
redesenhar a marca. O header e o footer usam por isso o lockup tipográfico "RASSË" em
`--font-display`, não uma imagem.

**Acção humana necessária:** fornecer o logo em SVG ou PNG de alta resolução. Enquanto não houver,
o lockup tipográfico fica — é uma solução legítima, não um placeholder partido.

---

## [Fase 2] Ícones: adição ao DESIGN.md, assinalada

**O quê:** o `DESIGN.md` diz que a marca não tem sistema de ícones e que, sendo inevitável, se use
Lucide com traço 1.5px "sinalizando como adição". O `PLAN.md` pede explicitamente um ícone de
cesta no header.

**Onde:** apenas dois ícones, ambos com `strokeWidth={1.5}` — `ShoppingBasket` em
`components/public/cart-link.tsx` e `Menu` em `components/public/mobile-nav.tsx`.

**Acção humana necessária:** nenhuma, a não ser que prefiras o header só com tipografia
("CESTA (2)"), que é o que o `DESIGN.md` favorece.

---

## [Fase 2] Fotografia real da oficina em falta

**O quê:** o `DESIGN.md` manda usar fotos reais e, enquanto não houver, placeholders neutros com
legenda em monospace. É o que está em `public/seed/` (10 SVGs).

**Acção humana necessária:** fornecer fotografia da oficina e das peças antes da Fase 10.

---

## [Fase 3] Renderizador de markdown escrito à mão

**O quê:** o `PLAN.md` pede "descrição em markdown renderizado", mas a lista de dependências do
`CLAUDE.md` não inclui nenhuma biblioteca de markdown. Instalar `react-markdown` seria sair da
lista sem autorização.

**Alternativa escolhida:** `lib/markdown.tsx`, um renderizador de um subconjunto que produz nós
React directamente — títulos `#` a `###`, parágrafos, listas ordenadas e não ordenadas, negrito,
itálico, código inline e links http(s)/mailto. Nunca gera HTML a partir de string, por isso não
há superfície de XSS, ao contrário de um `dangerouslySetInnerHTML` com markdown convertido.

**O que não suporta:** HTML embutido, imagens, tabelas, citações, blocos de código com cercas,
listas encaixadas.

**Acção humana necessária:** autorizar `react-markdown` + `remark-gfm` se as descrições vierem a
precisar de tabelas ou imagens. Até lá, o subconjunto cobre o que o `seed.ts` usa.

---

## [Fase 3] Contraste do botão primário fica abaixo de AA

**O quê:** o `DESIGN.md` (secção 5) manda o botão primário ter fundo `--accent` (copper-500,
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

**Acção humana necessária:** escolher uma das opções, ou aceitar 3,05:1 conscientemente. Tem de
ficar decidido antes da revisão de acessibilidade da Fase 10.

---

## [Fase 5] BLOQUEIO ACTIVO — faltam as contas Cloudflare (R2 e Turnstile)

**Estado:** a execução autónoma parou aqui. As fases 0 a 4 estão concluídas e commitadas.

A Fase 5 está marcada `[HUMAN]` no `PLAN.md` e precisa de dois serviços externos que não existem
ainda. Não há como avançar sem inventar credenciais ou simular os serviços — as duas coisas que o
`CLAUDE.md` e as regras de trabalho proíbem. Os critérios de aceitação da fase são, aliás,
impossíveis de provar sem eles: "STL de ~40 MB chega ao R2", "submeter sem Turnstile válido falha
no servidor".

### 1. Cloudflare R2 — armazenamento dos ficheiros

Cria um bucket em <https://dash.cloudflare.com> → R2 → _Create bucket_. Sugestão de nome:
`rasse-uploads`. Depois, em _Manage R2 API Tokens_, cria um token com permissão de
**Object Read & Write** limitado a esse bucket.

Preenche em `.env.local` (e mais tarde nas variáveis de ambiente da Vercel):

```
R2_ACCOUNT_ID=            # o Account ID do Cloudflare, visível na página do R2
R2_ACCESS_KEY_ID=         # do token criado
R2_SECRET_ACCESS_KEY=     # do token criado, só é mostrado uma vez
R2_BUCKET=rasse-uploads
R2_PUBLIC_URL=            # domínio público do bucket, com https://
```

O `R2_PUBLIC_URL` vem de _Settings → Public access_: ou o subdomínio `r2.dev` (bom para
desenvolvimento) ou um domínio próprio, por exemplo `https://ficheiros.oficinarasse.com.br`
(preferível em produção, e já previsto na Fase 10). O `next.config.ts` já o transforma
automaticamente em `images.remotePatterns` — não é preciso mexer lá.

**CORS do bucket** (Settings → CORS policy), sem o qual o upload directo do browser falha:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://SEU-DOMINIO"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. Cloudflare Turnstile — anti-spam do formulário

Em <https://dash.cloudflare.com> → Turnstile → _Add site_. Modo **Managed**, com os domínios
`localhost` e o domínio de produção.

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=   # a site key, é pública e vai para o browser
TURNSTILE_SECRET_KEY=             # a secret key, só servidor
```

Para testar sem uma conta real, a Cloudflare publica chaves de teste
(<https://developers.cloudflare.com/turnstile/troubleshooting/testing/>) que aceitam ou recusam
sempre. Servem para exercitar o caminho do código, mas **não provam** o critério de aceitação
"submeter sem Turnstile válido falha no servidor" contra o serviço real.

### 3. Já agora, para a Fase 6 (`[HUMAN]`, logo a seguir)

Só falta um segredo, e este posso gerar eu — diz apenas se preferes gerá-lo tu:

```
AUTH_SECRET=              # 32 bytes aleatórios; `openssl rand -base64 32`
```

### Como retomar

Preenche o `.env.local` com o que estiver disponível e diz para continuar. Se preferires,
posso avançar já para a **Fase 6** (autenticação e shell do dashboard), que só precisa do
`AUTH_SECRET`, e deixar a Fase 5 para quando as chaves da Cloudflare existirem — as duas fases não
dependem uma da outra. Isso troca a ordem do `PLAN.md`, por isso não o faço sem autorização.
