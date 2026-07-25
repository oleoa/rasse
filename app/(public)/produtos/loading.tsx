import { Container } from "@/components/public/container";
import { PageHeader } from "@/components/public/page-header";
import { ProductGridSkeleton } from "@/components/public/product-card-skeleton";
import { Accent } from "@/components/public/typography";
import { Skeleton } from "@/components/ui/skeleton";

export default function Carregando() {
  return (
    <>
      {/* O cabeçalho é fixo, então entra já com o texto real — só o catálogo espera. */}
      <PageHeader
        eyebrow="Catálogo"
        title={
          <>
            Feito para <Accent>durar</Accent>.
          </>
        }
        description="Cada peça sai da oficina lixada, conferida e embalada à mão."
      />

      <Container
        className="flex flex-col gap-8 pb-16"
        role="status"
        aria-label="Carregando o catálogo"
      >
        <div className="flex flex-wrap items-center gap-3">
          {Array.from({ length: 4 }, (_, filtro) => (
            <Skeleton key={filtro} className="h-9 w-28" />
          ))}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>

        <ProductGridSkeleton />
      </Container>
    </>
  );
}
