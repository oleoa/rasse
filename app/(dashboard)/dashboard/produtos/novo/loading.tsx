import { CabecalhoSkeleton, FormularioSkeleton } from "@/components/dashboard/skeletons";

export default function Carregando() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando o formulário">
      <CabecalhoSkeleton largura="w-56" />
      <FormularioSkeleton campos={9} />
    </div>
  );
}
