import { CabecalhoSkeleton, DetalheSkeleton } from "@/components/dashboard/skeletons";

export default function Carregando() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando o pedido">
      <CabecalhoSkeleton largura="w-48" />
      <DetalheSkeleton blocos={3} />
    </div>
  );
}
