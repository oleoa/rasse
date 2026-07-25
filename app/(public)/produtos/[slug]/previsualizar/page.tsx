import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/public/container";
import { ProductView } from "@/components/public/product-view";
import { getRelatedProducts } from "@/lib/queries/products";
import { getProductForPreview } from "@/lib/queries/preview";

export const metadata: Metadata = {
  title: "Pré-visualização",
  robots: { index: false, follow: false },
};

/**
 * Rota separada da pública de propósito: assim a página do catálogo continua
 * estática com ISR, e é só esta que é dinâmica. O token é um HMAC do id do
 * produto — quem o tiver vê o rascunho sem precisar de conta.
 */
export default async function PreVisualizarProdutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ slug }, { token }] = await Promise.all([params, searchParams]);
  const product = await getProductForPreview(slug, token);

  if (!product) notFound();

  const related = product.categoryId
    ? await getRelatedProducts(product.categoryId, product.id)
    : [];

  const rotulo =
    product.status === "published"
      ? "publicado"
      : product.status === "draft"
        ? "rascunho"
        : "arquivado";

  return (
    <ProductView
      product={product}
      related={related}
      aviso={
        <div className="border-b border-warning/40 bg-warning/15">
          <Container className="py-3">
            <p className="font-accent text-eyebrow tracking-caps text-warning uppercase">
              Pré-visualização · este produto está como {rotulo}
              {product.status === "published" ? "" : " e não aparece no catálogo"}
            </p>
          </Container>
        </div>
      }
    />
  );
}
