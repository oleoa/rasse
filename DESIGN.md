# DESIGN.md — Oficina Rassë (site)

Brief de design para o site da **Oficina Rassë**. Cole este arquivo na raiz de um projeto novo e siga-o como fonte única de verdade visual.

## 1. Marca

Oficina Rassë — oficina-ateliê-estúdio de conhecimento e produtos para aventuras, viagens e lifestyle. Produtos em madeira gravada a laser (tábuas de churrasco, peças personalizadas). **Autenticidade e rusticidade na medida certa.**

- Idioma: **português do Brasil**.
- Nome em texto corrido: **RASSË** (caixa alta, com trema). Lockup formal: **Oficina Rassë**.
- Voz: quente, artesanal, declarativa. Aforismos curtos, sempre terminando em ponto final. Primeira pessoa do plural ("Somos a Rassë").
- **Sem emoji.** Sem exclamação. Sem linguagem de marketing agressiva ("compre já", "imperdível").

Copy real da marca (use como referência de tom):

> "Explore o autêntico. Explore a RASSË." · "A beleza do rústico." · "Feito para durar." · "Mais que um detalhe. Uma marca que permanece." · "Cada detalhe conta uma história." · "Gravação em madeira."

Estrutura de bloco de texto: **eyebrow** em caixa alta tracked → **headline serifada** (com uma palavra em âmbar) → **linha de apoio pequena**.

## 2. Tokens

Cole em `tokens.css` (ou equivalente) e use sempre as variáveis, nunca hex solto.

```css
:root {
  /* Paleta base */
  --copper-300: #e0a05c;
  --copper-400: #cd8a41;
  --copper-500: #c07a30;
  --copper-600: #a3651f;
  --copper-700: #7e4d15;
  --amber-400: #d9992f;
  --amber-500: #c98136;
  --wood-200: #d9b98c;
  --wood-300: #b98a54;
  --wood-400: #9c6b35;
  --wood-500: #7a4e22;
  --wood-600: #5c3a18;
  --char-900: #15100b;
  --char-800: #1e1710;
  --char-700: #2a2118;
  --char-600: #3a2e21;
  --cream-50: #f7f0e3;
  --cream-100: #f2e7d5;
  --cream-200: #e6d6bc;
  --stone-400: #8d8781;
  --stone-500: #6e6a66;
  --stone-600: #4c4844;
  /* Semânticos */
  --surface-page: var(--char-900);
  --surface-card: var(--char-800);
  --surface-raised: var(--char-700);
  --surface-warm: linear-gradient(160deg, var(--wood-400), var(--wood-500));
  --text-display: var(--cream-50);
  --text-body: var(--cream-200);
  --text-muted: var(--stone-400);
  --text-accent: var(--amber-500);
  --text-on-warm: var(--cream-50);
  --accent: var(--copper-500);
  --accent-hover: var(--copper-400);
  --accent-press: var(--copper-600);
  --border-subtle: rgba(242, 231, 213, 0.14);
  --border-frame: var(--copper-600);
  --focus-ring: 0 0 0 2px rgba(201, 129, 54, 0.55);
  --success: #6f8f4f;
  --warning: var(--amber-400);
  --danger: #a8442e;
  /* Tipografia */
  --font-display: "Playfair Display", "Times New Roman", serif;
  --font-accent: "Oswald", "Arial Narrow", sans-serif;
  --font-body: "Lora", Georgia, serif;
  --text-hero: clamp(40px, 5vw, 64px);
  --text-h1: 40px;
  --text-h2: 28px;
  --text-h3: 20px;
  --text-body-size: 16px;
  --text-small: 13px;
  --text-eyebrow: 12px;
  --leading-tight: 1.1;
  --leading-body: 1.6;
  --tracking-caps: 0.14em;
  --tracking-eyebrow: 0.28em;
  --weight-display: 700;
  --weight-body: 400;
  --weight-medium: 500;
  /* Layout */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-pill: 999px;
  --shadow-card: 0 2px 10px rgba(0, 0, 0, 0.45);
  --shadow-raised: 0 8px 28px rgba(0, 0, 0, 0.55);
  --frame-border: 1px solid var(--border-frame);
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-fast: 120ms;
  --dur-med: 220ms;
}
a {
  color: var(--text-accent);
  text-decoration: none;
}
a:hover {
  color: var(--copper-300);
}
```

Fontes (Google Fonts — substituições, não são as originais da marca):

```html
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Oswald:wght@300..700&display=swap"
  rel="stylesheet"
/>
```

## 3. Uso da tipografia

| Papel                         | Fonte                | Tratamento                                                                                          |
| ----------------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| Hero / headline               | `--font-display` 700 | Caixa alta ou title case, `--leading-tight`. **Uma** palavra em `--text-accent` (itálico opcional). |
| Eyebrow / label / botão / nav | `--font-accent` 500  | Caixa alta, `letter-spacing: var(--tracking-eyebrow)` (eyebrow) ou `--tracking-caps` (UI).          |
| Corpo                         | `--font-body` 400    | `--leading-body`, medida máx. ~68ch, `text-wrap: pretty`.                                           |

Nunca use a serifada display em texto corrido; nunca use a condensada em parágrafos.

## 4. Regras visuais

- **Fundo padrão escuro:** `--surface-page`. Seções alternativas usam `--surface-warm` (gradiente madeira) ou foto full-bleed quente (madeira, brasa, fumaça).
- **Foto sobre texto:** sempre gradiente de proteção na base (`linear-gradient(transparent, rgba(21,16,11,.85))`).
- **Motivo assinatura:** moldura fina de cobre (`--frame-border`) recuada 12–16px da borda do bloco/hero. Usar com parcimônia — é o gesto da marca.
- **Cantos:** 3–6px. Nada arredondado tipo pílula, exceto tags pequenas.
- **Layout:** centrado, simétrico, muito respiro vertical (`--space-7`/`--space-8` entre seções). Máx. 1120px de largura de conteúdo.
- **Divisores:** régua 1px `--border-subtle` ou cobre curto (48px) centrado. Interponto `·` para separar itens inline.
- **Ícones:** a marca **não tem** sistema de ícones — prefira tipo, réguas e foto. Se for inevitável, Lucide com traço 1.5px, e sinalize como adição.
- **Movimento:** só fades e eases suaves de 220ms. Hover = cobre mais claro; press = cobre mais escuro. Sem bounce, sem parallax exagerado.
- **Nunca:** gradientes coloridos vibrantes, sombras coloridas, glassmorphism, emoji, cantos grandes, cor fria de qualquer tipo.

## 5. Componentes base

**Botão** — `--font-accent`, caixa alta, `--tracking-caps`, `--radius-sm`, `transition var(--dur-fast)`.

- md `11px 24px` / 13px · sm `8px 16px` / 12px · lg `14px 32px` / 15px
- `primary`: fundo `--accent`, texto `--cream-50`; hover `--accent-hover`.
- `secondary`: transparente, texto `--text-accent`, borda `--border-frame`; hover fundo `rgba(201,129,54,.12)`.
- `ghost`: transparente, texto `--text-body`.
- disabled: `opacity:.45`, `cursor:not-allowed`.

**Campo de formulário** — label em `--font-accent` 11px caixa alta `--text-muted`; input `--font-body` 15px, fundo `--char-700`, borda `--border-subtle`, `--radius-sm`, padding `10px 14px`. Foco: borda `--copper-500` + `--focus-ring`.

**Card** — fundo `--surface-card`, `--radius-md`, `--shadow-card`, borda `--border-subtle`. Imagem no topo em full-bleed, conteúdo com padding `--space-5`.

**Tag / Badge** — `--font-accent` 11px caixa alta tracked, `--radius-pill` (único caso de pílula), fundo `rgba(201,129,54,.14)`, texto `--text-accent`.

## 6. Estrutura sugerida do site

1. **Hero** — foto full-bleed de madeira/brasa + moldura de cobre, eyebrow "OFICINA · ATELIÊ · ESTÚDIO", headline serifada, CTA primário.
2. **Manifesto** — bloco de texto curto centrado sobre `--surface-page`, régua de cobre acima.
3. **Produtos** — grade de cards (tábuas, peças personalizadas), 3 colunas → 1 no mobile.
4. **Gravação em madeira** — seção de processo, foto grande + texto lateral em `--surface-warm`.
5. **Personalização / orçamento** — formulário curto (nome, contato, descrição da peça).
6. **Rodapé** — lockup, Instagram [@oficinarasse](https://www.instagram.com/oficinarasse/), contato, régua de cobre.

## 7. Pendências antes de produção

- ⚠️ **Logo:** só existem recortes de baixa resolução do print do Instagram. **Pedir os arquivos originais (SVG/PNG).** Nunca redesenhar a marca.
- ⚠️ **Fontes:** Playfair Display / Oswald / Lora são aproximações. Confirmar as fontes reais da marca.
- ⚠️ **Fotografia:** usar fotos reais da oficina. Enquanto não houver, placeholders neutros com legenda em monospace descrevendo a imagem — nunca ilustração vetorial genérica.
