import { CabecalhoSkeleton } from "@/components/dashboard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Carregando() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando a visão geral">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <CabecalhoSkeleton largura="w-48" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, periodo) => (
            <Skeleton key={periodo} className="h-9 w-24" />
          ))}
        </div>
      </div>

      {Array.from({ length: 2 }, (_, faixa) => (
        <div key={faixa} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, cartao) => (
            <Skeleton key={cartao} className="h-28 w-full" />
          ))}
        </div>
      ))}

      <Skeleton className="h-72 w-full" />

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, painel) => (
          <Skeleton key={painel} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}
