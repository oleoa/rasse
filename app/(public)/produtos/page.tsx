import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/public/container";
import { CategoryFilter } from "@/components/public/category-filter";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { ProductGrid } from "@/components/public/product-card";
import { Accent } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Produtos",
  description: "Tábuas, peças gravadas a laser e impressão 3D da Oficina Rassë.",
  openGraph: {
    title: "Produtos — Oficina Rassë",
    description: "Tábuas, peças gravadas a laser e impressão 3D da Oficina Rassë.",
    type: "website",
    locale: "pt_BR",
  },
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getPublishedProducts(categoria),
  ]);

  const activeCategory = categories.find((c) => c.slug === categoria);

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title={
          <>
            Feito para <Accent>durar</Accent>.
          </>
        }
        description="Cada peça sai da oficina lixada, conferida e embalada à mão."
      />

      <Container className="flex flex-col gap-8 pb-16">
        <CategoryFilter categories={categories} active={activeCategory?.slug} />

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-h3 font-bold text-display">
            {activeCategory?.name ?? "Todas as peças"}
          </h2>
          <p className="font-accent text-eyebrow tracking-caps text-subtle uppercase">
            {products.length === 1 ? "1 peça" : `${products.length} peças`}
          </p>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title={
              categoria && !activeCategory
                ? "Essa categoria não existe."
                : "Nenhuma peça nesta categoria."
            }
            description="Vê o catálogo completo ou pede uma peça sob medida."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/produtos">Ver tudo</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/personalizado">Pedir sob medida</Link>
                </Button>
              </div>
            }
          />
        )}
      </Container>
    </>
  );
}
