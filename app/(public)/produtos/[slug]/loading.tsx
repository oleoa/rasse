import { Container } from "@/components/public/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Carregando() {
  return (
    <Container className="py-12" role="status" aria-label="Carregando a peça">
      <div className="pb-8">
        <Skeleton className="h-3 w-32" />
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-[4/3] w-full rounded-md" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 2 }, (_, miniatura) => (
              <Skeleton key={miniatura} className="size-20" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full max-w-72" />
            <Skeleton className="h-12 w-56" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 py-16">
        <Skeleton className="h-px w-12" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-[68ch] max-w-full" />
        <Skeleton className="h-4 w-[52ch] max-w-full" />
      </div>
    </Container>
  );
}
