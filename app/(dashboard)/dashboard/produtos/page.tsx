import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductList } from "@/components/dashboard/product-list";
import { EmptyState } from "@/components/public/empty-state";
import { CopperRule } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { listAdminProducts } from "@/lib/queries/admin";
import { getCategories } from "@/lib/queries/categories";

export const metadata: Metadata = { title: "Produtos" };

export default async function ProdutosPainelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; categoria?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status === "draft" || params.status === "published" || params.status === "archived"
      ? params.status
      : undefined;

  const [resultado, categories] = await Promise.all([
    listAdminProducts({
      q: params.q?.trim() || undefined,
      status,
      categoria: params.categoria || undefined,
      pagina: Number(params.pagina) || 1,
    }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h1 className="font-display text-h2 font-bold text-display">Produtos.</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/produtos/novo">Novo produto</Link>
        </Button>
      </div>

      {resultado.total === 0 && !params.q && !status && !params.categoria ? (
        <EmptyState
          title="Ainda não há produtos."
          description="Cria o primeiro para o catálogo deixar de estar vazio."
          action={
            <Button asChild>
              <Link href="/dashboard/produtos/novo">Novo produto</Link>
            </Button>
          }
        />
      ) : (
        <Suspense fallback={<p className="text-small text-subtle">A carregar…</p>}>
          <ProductList
            linhas={resultado.linhas}
            categories={categories}
            pagina={resultado.pagina}
            paginas={resultado.paginas}
            total={resultado.total}
            filtros={{
              q: params.q ?? "",
              status: status ?? "",
              categoria: params.categoria ?? "",
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
