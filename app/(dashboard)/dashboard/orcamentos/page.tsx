import type { Metadata } from "next";
import { EmptyState } from "@/components/public/empty-state";
import { CopperRule } from "@/components/public/typography";

export const metadata: Metadata = { title: "Orçamentos" };

export default function Pagina() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <CopperRule />
        <h1 className="font-display text-h2 font-bold text-display">Orçamentos.</h1>
      </div>
      <EmptyState
        title="Ainda não está pronto."
        description="A lista de orçamentos entra na fase 8."
      />
    </div>
  );
}
