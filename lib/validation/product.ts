import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

/**
 * Schemas partilhados entre o formulário do painel e as Server Actions — o
 * cliente e o servidor validam com exactamente as mesmas regras.
 */

const slug = z
  .string()
  .trim()
  .min(1, "O endereço é obrigatório.")
  .max(80, "Máximo 80 caracteres.")
  .regex(SLUG_PATTERN, "Só letras minúsculas, números e hífenes.");

const opcional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable(),
  );

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "O nome é obrigatório.").max(120),
    slug,
    shortDescription: z.string().trim().min(1, "A descrição curta é obrigatória.").max(200),
    descriptionMd: z.string().trim().min(1, "A descrição é obrigatória.").max(8000),
    categoryId: z.uuid("Escolhe uma categoria.").nullable(),
    priceType: z.enum(["fixed", "on_request"]),
    priceCents: z.int().min(0, "O preço não pode ser negativo.").max(99_999_999).nullable(),
    status: z.enum(["draft", "published", "archived"]),
    isFeatured: z.boolean(),
    position: z.int().min(0).max(9999),
    allowsPersonalization: z.boolean(),
    personalizationLabel: opcional(80),
    personalizationHelp: opcional(120),
    variantGroupLabel: opcional(40),
    seoTitle: opcional(70),
    seoDescription: opcional(160),
  })
  .refine((v) => (v.priceType === "on_request" ? v.priceCents === null : v.priceCents !== null), {
    message: "Produtos com preço fixo precisam de um preço.",
    path: ["priceCents"],
  })
  .refine((v) => !v.allowsPersonalization || (v.personalizationLabel?.length ?? 0) > 0, {
    message: "Dá um nome ao campo de personalização.",
    path: ["personalizationLabel"],
  });

export type ProductInput = z.input<typeof productSchema>;
export type ProductValues = z.output<typeof productSchema>;

export const variantSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "A variante precisa de nome.").max(60),
  priceDeltaCents: z.int().min(-99_999_999).max(99_999_999),
});

export const variantsSchema = z.array(variantSchema).max(20);

export const imageSchema = z.object({
  id: z.uuid().nullable(),
  r2Key: z.string().min(1).max(400),
  alt: z.string().trim().min(1, "O texto alternativo é obrigatório.").max(160),
  width: z.int().positive(),
  height: z.int().positive(),
});

export const imagesSchema = z.array(imageSchema).max(12);

export const categorySchema = z.object({
  name: z.string().trim().min(2, "O nome é obrigatório.").max(60),
  slug,
  position: z.int().min(0).max(9999),
});

export type CategoryInput = z.input<typeof categorySchema>;

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2, "O nome do negócio é obrigatório.").max(80),
  whatsappNumber: z
    .string()
    .trim()
    .min(10, "O número tem de estar no formato internacional, só dígitos.")
    .max(20)
    .regex(/^\d+$/, "Só dígitos, sem espaços nem símbolos. Ex: 5511987654321."),
  heroTitle: z.string().trim().min(2, "O título do hero é obrigatório.").max(120),
  heroSubtitle: z.string().trim().min(2, "O subtítulo é obrigatório.").max(200),
  aboutMd: z.string().trim().min(1, "O texto sobre a oficina é obrigatório.").max(8000),
  instagramUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.url("Tem de ser um URL completo, com https://.").nullable(),
  ),
  contactEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.email("Email inválido.").nullable(),
  ),
  cnpj: opcional(20),
});

export type SettingsInput = z.input<typeof settingsSchema>;

/** Avisos de SEO — não impedem gravar, só chamam a atenção. */
export function seoWarnings(values: {
  seoTitle: string | null;
  seoDescription: string | null;
  name: string;
  shortDescription: string;
}): string[] {
  const avisos: string[] = [];
  const titulo = values.seoTitle ?? values.name;
  const descricao = values.seoDescription ?? values.shortDescription;

  if (titulo.length > 60)
    avisos.push(`O título de SEO tem ${titulo.length} caracteres; acima de 60 o Google corta.`);
  if (titulo.length < 15) avisos.push("O título de SEO é muito curto para dizer alguma coisa.");
  if (descricao.length > 155)
    avisos.push(
      `A descrição de SEO tem ${descricao.length} caracteres; acima de 155 o Google corta.`,
    );
  if (descricao.length < 50)
    avisos.push("A descrição de SEO é curta; entre 50 e 155 caracteres funciona melhor.");

  return avisos;
}
