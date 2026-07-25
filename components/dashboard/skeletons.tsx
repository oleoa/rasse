import { Skeleton } from "@/components/ui/skeleton";

/** Título de página do painel: régua de cobre + linha do título. */
export function CabecalhoSkeleton({ largura = "w-56" }: { largura?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-px w-12" />
      <Skeleton className={`h-8 ${largura}`} />
    </div>
  );
}

/** Espaço reservado com o mesmo ritmo das tabelas do painel, para não haver salto ao carregar. */
export function TabelaSkeleton({ linhas = 6, colunas = 5 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <tbody>
          <tr className="border-b border-border">
            {Array.from({ length: colunas }, (_, coluna) => (
              <td key={coluna} className="p-3">
                <Skeleton className="h-3 w-20" />
              </td>
            ))}
          </tr>
          {Array.from({ length: linhas }, (_, linha) => (
            <tr key={linha} className="border-b border-border">
              {Array.from({ length: colunas }, (_, coluna) => (
                <td key={coluna} className="p-3">
                  <Skeleton className={coluna === 0 ? "h-4 w-28" : "h-4 w-full max-w-32"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Barra de busca + seletores das listagens do painel. */
export function FiltrosSkeleton({ seletores = 1 }: { seletores?: number }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: seletores }, (_, seletor) => (
        <Skeleton key={seletor} className="h-10 w-40" />
      ))}
    </div>
  );
}

/** Sequência de rótulo + campo, como nos formulários de produto e configurações. */
export function FormularioSkeleton({ campos = 6 }: { campos?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: campos }, (_, campo) => (
        <div key={campo} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className={campo % 3 === 2 ? "h-24 w-full" : "h-10 w-full"} />
        </div>
      ))}
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

/** Detalhe de pedido ou orçamento: coluna larga de conteúdo + coluna lateral de ações. */
export function DetalheSkeleton({ blocos = 3 }: { blocos?: number }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        {Array.from({ length: blocos }, (_, bloco) => (
          <div key={bloco} className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
