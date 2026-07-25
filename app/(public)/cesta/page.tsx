import type { Metadata } from "next";
import { Container } from "@/components/public/container";
import { PageHeader } from "@/components/public/page-header";
import { Accent } from "@/components/public/typography";
import { CartPageClient } from "./cart-page-client";

export const metadata: Metadata = {
  title: "Cesta",
  description: "As peças que você escolheu, prontas para enviar pelo WhatsApp.",
  robots: { index: false, follow: true },
};

export default function CestaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pedido"
        title={
          <>
            A sua <Accent>cesta</Accent>.
          </>
        }
        description="Confira as peças e envie. O fechamento do negócio acontece na conversa."
      />

      <Container className="pb-20">
        <CartPageClient />
      </Container>
    </>
  );
}
