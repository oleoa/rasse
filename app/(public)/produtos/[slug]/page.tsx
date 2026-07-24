import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/public/container";
import { ProductGallery } from "@/components/public/product-gallery";
import { ProductGrid } from "@/components/public/product-card";
import { ProductPurchase } from "@/components/public/product-purchase";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/images";
import { Markdown } from "@/lib/markdown";
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

  const cover = product.images[0];
  // O JSON-LD precisa de URLs absolutos; imageUrl devolve caminhos locais para o seed.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const coverUrl = cover ? new URL(imageUrl(cover.r2Key), siteUrl).toString() : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    ...(coverUrl ? { image: [coverUrl] } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      ...(product.priceType === "fixed" && product.priceCents !== null
        ? { price: (product.priceCents / 100).toFixed(2) }
        : {}),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON serializado, sem input do utilizador na estrutura.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="py-12">
        <nav aria-label="Trilho" className="pb-8">
          <Link
            href={product.category ? `/produtos?categoria=${product.category.slug}` : "/produtos"}
            className="font-accent text-eyebrow tracking-caps text-subtle uppercase"
          >
            ← {product.category?.name ?? "Produtos"}
          </Link>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              {product.category ? <Eyebrow>{product.category.name}</Eyebrow> : null}
              <h1 className="font-display text-h1 font-bold text-display">{product.name}</h1>
              <p className="text-base text-body">{product.shortDescription}</p>
            </div>

            <ProductPurchase product={product} />
          </div>
        </div>

        <section className="flex flex-col gap-4 py-16">
          <CopperRule />
          <h2 className="font-display text-h2 font-bold text-display">Sobre a peça.</h2>
          <div className="max-w-[68ch]">
            <Markdown>{product.descriptionMd}</Markdown>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="flex flex-col gap-6 pb-8">
            <CopperRule />
            <h2 className="font-display text-h2 font-bold text-display">Da mesma categoria.</h2>
            <ProductGrid products={related} />
          </section>
        ) : (
          <section className="flex flex-col items-start gap-4 pb-8">
            <CopperRule />
            <p className="text-small text-subtle">Não há outras peças nesta categoria.</p>
            <Button asChild variant="outline">
              <Link href="/produtos">Ver o catálogo</Link>
            </Button>
          </section>
        )}
      </Container>
    </>
  );
}
