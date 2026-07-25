import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/public/product-view";
import { imageUrl } from "@/lib/images";
import {
  getProductBySlug,
  getPublishedProductSlugs,
  getRelatedProducts,
} from "@/lib/queries/products";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Produto não encontrado" };

  const title = product.seoTitle ?? product.name;
  const description = product.seoDescription ?? product.shortDescription;
  const cover = product.images[0];
  const image = cover ? imageUrl(cover.r2Key) : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "pt_BR",
      images: image ? [{ url: image, alt: cover?.alt ?? product.name }] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = product.categoryId
    ? await getRelatedProducts(product.categoryId, product.id)
    : [];

  return <ProductView product={product} related={related} />;
}
