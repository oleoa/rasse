import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/dashboard/product-form";
import { CopperRule } from "@/components/public/typography";
import { Badge } from "@/components/ui/badge";
import { previewToken } from "@/lib/preview";
import { getCategories } from "@/lib/queries/categories";
import { getAdminProduct } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [produto, categories] = await Promise.all([getAdminProduct(id), getCategories()]);

  if (!produto) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h1 className="font-display text-h2 font-bold text-display">{produto.name}</h1>
        </div>
        <Badge variant={produto.status === "published" ? "success" : "secondary"}>
          {produto.status === "published"
            ? "Publicado"
            : produto.status === "draft"
              ? "Rascunho"
              : "Arquivado"}
        </Badge>
      </div>

      <ProductForm
        novoProductId={randomUUID()}
        categories={categories}
        previewUrl={`/produtos/${produto.slug}/previsualizar?token=${previewToken(produto.id)}`}
        imagensIniciais={produto.images.map((i) => ({
          id: i.id,
          r2Key: i.r2Key,
          alt: i.alt,
          width: i.width,
          height: i.height,
        }))}
        variantesIniciais={produto.variants.map((v) => ({
          id: v.id,
          name: v.name,
          priceDeltaCents: v.priceDeltaCents,
        }))}
        inicial={{
          id: produto.id,
          name: produto.name,
          slug: produto.slug,
          shortDescription: produto.shortDescription,
          descriptionMd: produto.descriptionMd,
          categoryId: produto.categoryId,
          priceType: produto.priceType,
          priceReais: produto.priceCents === null ? "" : (produto.priceCents / 100).toFixed(2),
          status: produto.status,
          isFeatured: produto.isFeatured,
          position: produto.position,
          allowsPersonalization: produto.allowsPersonalization,
          personalizationLabel: produto.personalizationLabel ?? "",
          personalizationHelp: produto.personalizationHelp ?? "",
          variantGroupLabel: produto.variantGroupLabel ?? "",
          seoTitle: produto.seoTitle ?? "",
          seoDescription: produto.seoDescription ?? "",
        }}
      />
    </div>
  );
}
