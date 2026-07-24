import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/neon-http";
import { categories, productImages, productVariants, products, settings, users } from "./schema.ts";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL em falta. Corre com --env-file=.env.local.");
}

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed recusa correr com NODE_ENV=production.");
}

const db = drizzle({ client: neon(url), casing: "snake_case" });

type SeedImage = { file: string; alt: string };

type SeedVariant = { name: string; priceDeltaCents: number };

type SeedProduct = {
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

const SEED_CATEGORIES = [
  { slug: "tabuas", name: "Tábuas", position: 0 },
  { slug: "gravacao-personalizada", name: "Gravação personalizada", position: 1 },
  { slug: "impressao-3d", name: "Impressão 3D", position: 2 },
];

const SEED_PRODUCTS: SeedProduct[] = [
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
        file: "tabua-churrasco-rustica-1.svg",
        alt: "Tábua de churrasco em madeira maciça vista de topo",
      },
      {
        file: "tabua-churrasco-rustica-2.svg",
        alt: "Tábua de churrasco de perfil sobre a bancada da oficina",
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
        file: "tabua-gravada-nome-familia-1.svg",
        alt: "Tábua com nome de família gravado a laser",
      },
      {
        file: "tabua-gravada-nome-familia-2.svg",
        alt: "Detalhe macro da gravação a laser na madeira",
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
    images: [{ file: "tabua-corte-redonda-1.svg", alt: "Tábua de corte redonda com alça" }],
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
        file: "placa-decorativa-gravada-1.svg",
        alt: "Placa decorativa em madeira com texto gravado",
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
    images: [{ file: "suporte-fone-3d-1.svg", alt: "Suporte de fone impresso em 3D" }],
  },
  {
    slug: "vaso-geometrico-3d",
    name: "Vaso Geométrico 3D",
    categorySlug: "impressao-3d",
    shortDescription: "Facetado, para plantas pequenas.",
    descriptionMd: "Vaso geométrico impresso em 3D, com faceta larga e parede espessa.",
    priceCents: 7900,
    status: "archived",
    images: [{ file: "vaso-geometrico-3d-1.svg", alt: "Vaso geométrico impresso em 3D" }],
  },
  {
    slug: "peca-3d-sob-medida",
    name: "Peça 3D Sob Medida",
    categorySlug: "impressao-3d",
    shortDescription: "Do seu desenho à peça pronta.",
    descriptionMd:
      "Impressão de peça 3D a partir do seu ficheiro ou da sua ideia.\n\nO valor depende do tamanho, do material e do acabamento — combinamos no WhatsApp.",
    priceCents: null,
    status: "published",
    images: [{ file: "peca-3d-sob-medida-1.svg", alt: "Peças 3D sob medida agrupadas" }],
  },
  {
    slug: "kit-tabua-espatula",
    name: "Kit Tábua e Espátula",
    categorySlug: "tabuas",
    shortDescription: "A tábua e a espátula, do mesmo lote de madeira.",
    descriptionMd: "Kit com tábua e espátula cortadas do mesmo lote, com o mesmo acabamento.",
    priceCents: 24900,
    status: "draft",
    images: [{ file: "kit-tabua-espatula-1.svg", alt: "Kit com tábua e espátula de madeira" }],
  },
];

function resolveAdminPassword(): { password: string; generated: boolean } {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD;
  if (fromEnv && fromEnv.length > 0) return { password: fromEnv, generated: false };
  return { password: randomBytes(12).toString("base64url"), generated: true };
}

async function main() {
  await db.insert(settings).values({
    id: 1,
    whatsappNumber: "550000000000",
    businessName: "Oficina Rassë",
    heroTitle: "Explore o autêntico.",
    heroSubtitle: "Gravação em madeira e impressão 3D, peça a peça.",
    instagramUrl: "https://www.instagram.com/oficinarasse/",
    aboutMd:
      "Somos a Rassë.\n\nUma oficina-ateliê que trabalha madeira gravada a laser e impressão 3D. Cada peça sai daqui lixada, conferida e embalada à mão.\n\nA beleza do rústico. Feito para durar.",
    cnpj: null,
    contactEmail: null,
  });

  const insertedCategories = await db.insert(categories).values(SEED_CATEGORIES).returning();
  const categoryIdBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  for (const [index, product] of SEED_PRODUCTS.entries()) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoria desconhecida no seed: ${product.categorySlug}`);
    }

    const [inserted] = await db
      .insert(products)
      .values({
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        descriptionMd: product.descriptionMd,
        categoryId,
        priceType: product.priceCents === null ? "on_request" : "fixed",
        priceCents: product.priceCents,
        status: product.status,
        isFeatured: product.isFeatured ?? false,
        position: index,
        allowsPersonalization: product.personalization !== undefined,
        personalizationLabel: product.personalization?.label ?? null,
        personalizationHelp: product.personalization?.help ?? null,
        variantGroupLabel: product.variantGroupLabel ?? null,
        seoTitle: `${product.name} — Oficina Rassë`,
        seoDescription: product.shortDescription,
      })
      .returning({ id: products.id });

    if (!inserted) {
      throw new Error(`Falhou a inserção do produto ${product.slug}.`);
    }

    await db.insert(productImages).values(
      product.images.map((image, position) => ({
        productId: inserted.id,
        r2Key: `seed/${image.file}`,
        alt: image.alt,
        width: 1200,
        height: 900,
        position,
      })),
    );

    if (product.variants && product.variants.length > 0) {
      await db.insert(productVariants).values(
        product.variants.map((variant, position) => ({
          productId: inserted.id,
          name: variant.name,
          priceDeltaCents: variant.priceDeltaCents,
          position,
        })),
      );
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@oficinarasse.local";
  const { password, generated } = resolveAdminPassword();

  await db.insert(users).values({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    name: "Administrador",
  });

  const linhas = [
    `Seed concluído em ${new URL(url!).hostname}.`,
    `  categorias: ${insertedCategories.length}`,
    `  produtos:   ${SEED_PRODUCTS.length}`,
    `  admin:      ${email}`,
    generated
      ? `  password:   ${password}   (gerada agora — guarda-a, não volta a aparecer)`
      : "  password:   a de SEED_ADMIN_PASSWORD",
    "",
  ];

  process.stdout.write(linhas.join("\n"));
}

await main();
