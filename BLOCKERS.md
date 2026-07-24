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
