import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/public/container";
import { EmptyState } from "@/components/public/empty-state";
import { ProductGrid } from "@/components/public/product-card";
import { Accent, CopperRule, Eyebrow, Prose } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/lib/markdown";
import { getFeaturedProducts } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/settings";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: { absolute: settings?.businessName ?? "Oficina Rassë" },
    description: settings?.heroSubtitle,
    openGraph: {
      title: settings?.businessName ?? "Oficina Rassë",
      description: settings?.heroSubtitle,
      type: "website",
      locale: "pt_BR",
    },
  };
}

export default async function HomePage() {
  const [settings, featured] = await Promise.all([getSettings(), getFeaturedProducts()]);

  return (
    <>
      <section className="frame border-b border-border">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <Eyebrow>Oficina · Ateliê · Estúdio</Eyebrow>
          <h1 className="font-display text-hero font-bold text-display">
            {renderHeroTitle(settings?.heroTitle ?? "Explore o autêntico.")}
          </h1>
          {settings?.heroSubtitle ? (
            <p className="max-w-[52ch] text-base text-body">{settings.heroSubtitle}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button asChild size="lg">
              <Link href="/produtos">Ver o catálogo</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/personalizado">Pedir peça sob medida</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-8 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <CopperRule />
          <h2 className="font-display text-h2 font-bold text-display">Em destaque.</h2>
        </div>

        {featured.length > 0 ? (
          <ProductGrid products={featured} />
        ) : (
          <EmptyState
            title="Ainda não há peças em destaque."
            description="O catálogo completo continua disponível."
            action={
              <Button asChild variant="outline">
                <Link href="/produtos">Ver o catálogo</Link>
              </Button>
            }
          />
        )}

        <div className="flex justify-center pt-2">
          <Button asChild variant="ghost">
            <Link href="/produtos">Ver tudo</Link>
          </Button>
        </div>
      </Container>

      {settings?.aboutMd ? (
        <section className="border-t border-border">
          <Container className="flex flex-col items-center gap-6 py-16 text-center">
            <CopperRule />
            <Eyebrow>A oficina</Eyebrow>
            <Prose className="text-center">
              <Markdown>{settings.aboutMd}</Markdown>
            </Prose>
            <Button asChild variant="ghost">
              <Link href="/quem-somos">Quem somos</Link>
            </Button>
          </Container>
        </section>
      ) : null}

      <section className="surface-warm">
        <Container className="flex flex-col items-center gap-5 py-16 text-center">
          <h2 className="font-display text-h2 font-bold">Tens um desenho na cabeça.</h2>
          <p className="max-w-[52ch] text-base">
            Envia a ideia e os ficheiros. Combinamos o resto na conversa.
          </p>
          <Button asChild size="lg">
            <Link href="/personalizado">Pedir peça sob medida</Link>
          </Button>
        </Container>
      </section>
    </>
  );
}

/** A última palavra do título fica em cobre — ver DESIGN.md, secção 3. */
function renderHeroTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return title;

  const last = words[words.length - 1]!;
  const rest = words.slice(0, -1).join(" ");
  const punctuation = /[.!?…]+$/.exec(last)?.[0] ?? "";
  const word = punctuation ? last.slice(0, -punctuation.length) : last;

  return (
    <>
      {rest} <Accent>{word}</Accent>
      {punctuation}
    </>
  );
}
