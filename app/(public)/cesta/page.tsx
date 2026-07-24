import type { Metadata } from "next";
import { Container } from "@/components/public/container";
import { PageHeader } from "@/components/public/page-header";
import { Accent } from "@/components/public/typography";
import { CartPageClient } from "./cart-page-client";

export const metadata: Metadata = {
  title: "Cesta",
  description: "As peças que escolheste, prontas a enviar pelo WhatsApp.",
  robots: { index: false, follow: true },
};

export default function CestaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pedido"
        title={
          <>
            A tua <Accent>cesta</Accent>.
          </>
        }
        description="Confere as peças e envia. O fecho do negócio acontece na conversa."
      />

      <Container className="pb-20">
        <CartPageClient />
      </Container>
    </>
  );
}
