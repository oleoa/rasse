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
