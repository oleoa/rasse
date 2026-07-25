import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { ProductForm } from "@/components/dashboard/product-form";
import { CopperRule } from "@/components/public/typography";
import { getCategories } from "@/lib/queries/categories";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NovoProdutoPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <CopperRule />
        <h1 className="font-display text-h2 font-bold text-display">Novo produto.</h1>
      </div>

      <ProductForm
        novoProductId={randomUUID()}
        categories={categories}
        previewUrl={null}
        imagensIniciais={[]}
        variantesIniciais={[]}
        inicial={{
          id: null,
          name: "",
          slug: "",
          shortDescription: "",
          descriptionMd: "",
          categoryId: categories[0]?.id ?? null,
          priceType: "fixed",
          priceReais: "",
          status: "draft",
          isFeatured: false,
          position: 0,
          allowsPersonalization: false,
          personalizationLabel: "",
          personalizationHelp: "",
          variantGroupLabel: "",
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </div>
  );
}
