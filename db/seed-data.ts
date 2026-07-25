// Dados de demonstração, sem efeitos colaterais: o `db/seed.ts` insere, o
// `scripts/atualizar-imagens-seed.ts` atualiza, e ambos leem daqui.
//
// As fotos em `public/seed/` são de banco de imagens (Unsplash), usadas só para
// o site ter cara de site enquanto as fotos reais da oficina não chegam. Ver
// BLOCKERS.md.

export type SeedImage = { file: string; alt: string };

export type SeedVariant = { name: string; priceDeltaCents: number };

export type SeedProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  descriptionMd: string;
  priceCents: number | null;
  status: "draft" | "published" | "archived";
  isFeatured?: boolean;
  personalization?: { label: string; help: string };
  variantGroupLabel?: string;
  variants?: SeedVariant[];
  images: SeedImage[];
};

/** Todas as fotos de `public/seed/` são baixadas neste tamanho. */
export const IMAGEM_LARGURA = 1200;
export const IMAGEM_ALTURA = 900;

export const SEED_CATEGORIES = [
  { slug: "tabuas", name: "Tábuas", position: 0 },
  { slug: "gravacao-personalizada", name: "Gravação personalizada", position: 1 },
  { slug: "impressao-3d", name: "Impressão 3D", position: 2 },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "tabua-churrasco-rustica",
    name: "Tábua de Churrasco Rústica",
    categorySlug: "tabuas",
    shortDescription: "Madeira maciça, acabamento rústico, feita para durar.",
    descriptionMd:
      "Tábua de churrasco em madeira maciça, com acabamento rústico e canto suave.\n\nCada peça é lixada e finalizada à mão na oficina. A veia da madeira muda de peça para peça — não existem duas iguais.",
    priceCents: 18900,
    status: "published",
    isFeatured: true,
    variantGroupLabel: "Tamanho",
    variants: [
      { name: "Média", priceDeltaCents: 0 },
      { name: "Grande", priceDeltaCents: 4000 },
      { name: "Família", priceDeltaCents: 9000 },
    ],
    images: [
      {
        file: "tabua-churrasco-rustica-1.jpg",
        alt: "Tábua de corte clara vista de cima, sobre uma mesa de madeira escura",
      },
      {
        file: "tabua-churrasco-rustica-2.jpg",
        alt: "Tábua de madeira com garfo de trinchar e cutelo ao lado, sobre tábuas escuras",
      },
    ],
  },
  {
    slug: "tabua-gravada-nome-familia",
    name: "Tábua Gravada com Nome de Família",
    categorySlug: "gravacao-personalizada",
    shortDescription: "O nome da casa gravado a laser na madeira.",
    descriptionMd:
      "Tábua em madeira maciça com o nome da família gravado a laser.\n\nA gravação é feita a fundo, não é pintura: resiste ao uso e ao tempo.",
    priceCents: 22900,
    status: "published",
    isFeatured: true,
    personalization: { label: "Nome da família", help: "Máx. 24 caracteres" },
    variantGroupLabel: "Tamanho",
    variants: [
      { name: "Média", priceDeltaCents: 0 },
      { name: "Grande", priceDeltaCents: 5000 },
    ],
    images: [
      {
        file: "tabua-gravada-nome-familia-1.jpg",
        alt: "Tábua de madeira com garfo de trinchar e faca, sobre fundo escuro de ardósia",
      },
      {
        file: "tabua-gravada-nome-familia-2.jpg",
        alt: "Tábua de madeira com faca e garfo apoiados na borda, sobre mesa rústica",
      },
    ],
  },
  {
    slug: "tabua-corte-redonda",
    name: "Tábua de Corte Redonda",
    categorySlug: "tabuas",
    shortDescription: "Redonda, com alça, para servir e para cortar.",
    descriptionMd:
      "Tábua redonda com alça, boa para servir queijos e pães e igualmente boa para o dia a dia da cozinha.",
    priceCents: 12900,
    status: "published",
    images: [
      {
        file: "tabua-corte-redonda-1.jpg",
        alt: "Pilha de tábuas de corte redondas sobre uma bancada de madeira",
      },
    ],
  },
  {
    slug: "placa-decorativa-gravada",
    name: "Placa Decorativa Gravada",
    categorySlug: "gravacao-personalizada",
    shortDescription: "Uma frase curta, gravada para ficar.",
    descriptionMd:
      "Placa em madeira para parede ou bancada, com o texto que escolher gravado a laser.\n\nMais que um detalhe. Uma marca que permanece.",
    priceCents: 8900,
    status: "published",
    isFeatured: true,
    personalization: { label: "Texto para gravação", help: "Máx. 30 caracteres" },
    images: [
      {
        file: "placa-decorativa-gravada-1.jpg",
        alt: "Placa de madeira com letras e uma seta gravadas em baixo relevo",
      },
    ],
  },
  {
    slug: "suporte-fone-3d",
    name: "Suporte para Fone 3D",
    categorySlug: "impressao-3d",
    shortDescription: "Peça impressa em 3D, base larga e estável.",
    descriptionMd:
      "Suporte de fone impresso em 3D, com base larga e acabamento fosco. Impresso na oficina, camada a camada.",
    priceCents: 6500,
    status: "published",
    images: [
      {
        file: "suporte-fone-3d-1.jpg",
        alt: "Fone de ouvido apoiado em um suporte, sobre uma bancada de madeira clara",
      },
    ],
  },
  {
    slug: "vaso-geometrico-3d",
    name: "Vaso Geométrico 3D",
    categorySlug: "impressao-3d",
    shortDescription: "Facetado, para plantas pequenas.",
    descriptionMd: "Vaso geométrico impresso em 3D, com faceta larga e parede espessa.",
    priceCents: 7900,
    status: "archived",
    images: [
      {
        file: "vaso-geometrico-3d-1.jpg",
        alt: "Vaso com nervuras em espiral, impresso em 3D, sobre fundo escuro",
      },
    ],
  },
  {
    slug: "peca-3d-sob-medida",
    name: "Peça 3D Sob Medida",
    categorySlug: "impressao-3d",
    shortDescription: "Do seu desenho à peça pronta.",
    descriptionMd:
      "Impressão de peça 3D a partir do seu arquivo ou da sua ideia.\n\nO valor depende do tamanho, do material e do acabamento — combinamos no WhatsApp.",
    priceCents: null,
    status: "published",
    images: [
      {
        file: "peca-3d-sob-medida-1.jpg",
        alt: "Escultura geométrica de faces facetadas, impressa em 3D",
      },
    ],
  },
  {
    slug: "kit-tabua-espatula",
    name: "Kit Tábua e Espátula",
    categorySlug: "tabuas",
    shortDescription: "A tábua e a espátula, do mesmo lote de madeira.",
    descriptionMd: "Kit com tábua e espátula cortadas do mesmo lote, com o mesmo acabamento.",
    priceCents: 24900,
    status: "draft",
    images: [
      {
        file: "kit-tabua-espatula-1.jpg",
        alt: "Tábua redonda com cabo apoiada em outras tábuas, ao lado de utensílios de madeira",
      },
    ],
  },
];
