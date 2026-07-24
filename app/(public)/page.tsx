import { PageHeader } from "@/components/public/page-header";
import { Accent } from "@/components/public/typography";

export default function HomePage() {
  return (
    <PageHeader
      eyebrow="Oficina · Ateliê · Estúdio"
      title={
        <>
          Explore o <Accent>autêntico</Accent>.
        </>
      }
      description="O catálogo entra na fase seguinte do plano."
    />
  );
}
