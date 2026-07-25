import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/public/container";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { Accent, Prose } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/lib/markdown";
import { getSettings } from "@/lib/queries/settings";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: "Quem somos",
    description: settings?.heroSubtitle,
    openGraph: {
      title: "Quem somos — Oficina Rassë",
      description: settings?.heroSubtitle,
      type: "website",
      locale: "pt_BR",
    },
  };
}

export default async function QuemSomosPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="A oficina"
        title={
          <>
            Somos a <Accent>Rassë</Accent>.
          </>
        }
      />

      <Container className="flex flex-col items-center gap-8 pb-20">
        {settings?.aboutMd ? (
          <Prose>
            <Markdown>{settings.aboutMd}</Markdown>
          </Prose>
        ) : (
          <EmptyState
            title="O texto da oficina ainda não foi escrito."
            description="Entre pelo painel, em Configurações."
          />
        )}

        <Button asChild variant="outline">
          <Link href="/produtos">Ver o catálogo</Link>
        </Button>
      </Container>
    </>
  );
}
