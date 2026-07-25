import type { Metadata } from "next";
import { Container } from "@/components/public/container";
import { PageHeader } from "@/components/public/page-header";
import { QuoteForm } from "@/components/public/quote-form";
import { Accent } from "@/components/public/typography";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Peça personalizada",
  description:
    "Envia a tua ideia e os ficheiros. Fazemos peças sob medida em impressão 3D e gravação a laser.",
  openGraph: {
    title: "Peça personalizada — Oficina Rassë",
    description: "Envia a tua ideia e os ficheiros para uma peça sob medida.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function PersonalizadoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sob medida"
        title={
          <>
            Cada detalhe conta uma <Accent>história</Accent>.
          </>
        }
        description="Manda a ideia e, se tiveres, os ficheiros. Respondemos pelo contacto que deixares."
      />

      <Container className="pb-20">
        <QuoteForm siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      </Container>
    </>
  );
}
