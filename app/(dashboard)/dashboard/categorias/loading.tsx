import { CabecalhoSkeleton } from "@/components/dashboard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Carregando() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando as categorias">
      <div className="flex flex-col gap-3">
        <CabecalhoSkeleton largura="w-48" />
        <Skeleton className="h-4 w-[60ch] max-w-full" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, categoria) => (
          <Skeleton key={categoria} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
