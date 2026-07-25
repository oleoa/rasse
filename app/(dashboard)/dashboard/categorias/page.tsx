import type { Metadata } from "next";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { CopperRule } from "@/components/public/typography";
import { listCategoriesWithCounts } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriasPainelPage() {
  const categorias = await listCategoriesWithCounts();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <CopperRule />
        <h1 className="font-display text-h2 font-bold text-display">Categorias.</h1>
        <p className="max-w-[68ch] text-small text-subtle">
          A ordem aqui é a ordem dos filtros no catálogo. Uma categoria com produtos não pode ser
          apagada — move os produtos primeiro.
        </p>
      </div>

      <CategoryManager categorias={categorias} />
    </div>
  );
}
