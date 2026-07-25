import { CabecalhoSkeleton, FormularioSkeleton } from "@/components/dashboard/skeletons";

export default function Carregando() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando o produto">
      <CabecalhoSkeleton largura="w-64" />
      <FormularioSkeleton campos={9} />
    </div>
  );
}
