import Link from "next/link";
import { Container } from "@/components/public/container";
import { ProductGallery } from "@/components/public/product-gallery";
import { ProductGrid } from "@/components/public/product-card";
import { ProductViewTracker } from "@/components/public/page-tracker";
import { ProductPurchase } from "@/components/public/product-purchase";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/images";
import { Markdown } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";
import type { ProductDetail, ProductListItem } from "@/lib/queries/products";

/**
 * A página pública e a pré-visualização de rascunhos renderizam exactamente o
 * mesmo — a diferença está só em quem consegue chegar a cada rota.
 */
export function ProductView({
  product,
  related,
  aviso,
}: {
  product: ProductDetail;
  related: ProductListItem[];
  aviso?: React.ReactNode;
}) {
  const cover = product.images[0];
  // O JSON-LD precisa de URLs absolutos; imageUrl devolve caminhos locais para o seed.
  const coverUrl = cover ? new URL(imageUrl(cover.r2Key), SITE_URL).toString() : undefined;

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

      <ProductViewTracker productId={product.id} />

      {aviso}

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
