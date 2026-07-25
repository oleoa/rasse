import { CabecalhoSkeleton, TabelaSkeleton } from "@/components/dashboard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Carregando() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando os pedidos">
      <div className="flex flex-col gap-3">
        <CabecalhoSkeleton largura="w-40" />
        <Skeleton className="h-4 w-[46ch] max-w-full" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <TabelaSkeleton colunas={6} />
    </div>
  );
}
