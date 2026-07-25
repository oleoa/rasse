import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/public/container";
import { EmptyState } from "@/components/public/empty-state";
import { HomeHero, withAccentedLastWord } from "@/components/public/home-hero";
import { PhotoSlot } from "@/components/public/photo-slot";
import { ProductGrid } from "@/components/public/product-card";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/lib/markdown";
import { getFeaturedProducts } from "@/lib/queries/products";
import { getSettings } from "@/lib/queries/settings";

export const revalidate = 60;

const APHORISMS = [
  "A beleza do rústico.",
  "Cada detalhe conta uma história.",
  "Mais que um detalhe. Uma marca que permanece.",
];

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
  const about = splitAbout(settings?.aboutMd);

  return (
    <>
      <HomeHero
        title={settings?.heroTitle ?? "Explore o autêntico."}
        subtitle={settings?.heroSubtitle}
      />

      <section className="border-y border-border bg-char-800">
        <Container className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 py-8 text-center font-accent text-eyebrow tracking-caps text-subtle uppercase">
          {APHORISMS.map((aphorism, index) => (
            <span key={aphorism} className="contents">
              {index > 0 ? (
                <span aria-hidden="true" className="text-copper-600">
                  ·
                </span>
              ) : null}
              <span>{aphorism}</span>
            </span>
          ))}
        </Container>
      </section>

      <section id="produtos" className="bg-char-900">
        <Container className="flex flex-col gap-16 py-24 sm:py-28">
          <div className="flex flex-col items-center gap-4 text-center">
            <Eyebrow className="text-amber-500">Produtos</Eyebrow>
            <h2 className="font-display text-h1 font-bold text-display">Em destaque.</h2>
            <CopperRule className="mt-2" />
          </div>

          {featured.length > 0 ? (
            <ProductGrid products={featured} />
          ) : (
            <EmptyState
              title="Ainda não há peças em destaque."
              description="O catálogo completo continua disponível."
            />
          )}

          <div className="flex justify-center">
            <Button asChild variant="ghost">
              <Link href="/produtos">Ver tudo →</Link>
            </Button>
          </div>
        </Container>
      </section>

      {about ? (
        <section id="oficina" className="border-t border-border bg-char-800">
          <Container className="grid grid-cols-1 items-center gap-16 py-24 sm:py-28 lg:grid-cols-2">
            <div className="frame mx-auto w-full max-w-110">
              <PhotoSlot
                caption="Foto da oficina — bancada, madeira, gravação"
                className="aspect-4/5 rounded-sm"
              />
            </div>

            <div className="flex flex-col items-start">
              <Eyebrow className="mb-4 text-amber-500">A oficina</Eyebrow>
              <h2 className="mb-6 font-display text-h1 font-bold text-display">
                {withAccentedLastWord(about.headline)}
              </h2>
              {about.body ? (
                <div className="max-w-[52ch]">
                  <Markdown>{about.body}</Markdown>
                </div>
              ) : null}
              {about.coda ? (
                <p className="mt-5 font-display text-h3 text-cream-100 italic">{about.coda}</p>
              ) : null}
              <Button asChild variant="outline" className="mt-9">
                <Link href="/quem-somos">Quem somos</Link>
              </Button>
            </div>
          </Container>
        </section>
      ) : null}

      <section id="personalizado" className="bg-char-900">
        <Container className="py-24 sm:py-28">
          <div className="mx-auto max-w-250 rounded-md p-4 surface-warm shadow-card">
            <div className="rounded-sm border border-cream-50/45 px-10 py-16 text-center sm:py-18">
              <Eyebrow className="mb-4 text-cream-100 opacity-85">Sob medida</Eyebrow>
              <h2 className="font-display text-[clamp(30px,3.4vw,42px)] leading-[1.1] font-bold text-balance text-cream-50">
                Tem um desenho na cabeça.
              </h2>
              <p className="mx-auto mt-5 mb-10 max-w-[46ch] leading-[1.6] text-cream-100">
                Envie a ideia e os arquivos. Combinamos o resto na conversa.
              </p>
              <Button asChild size="lg" className="bg-char-800 text-cream-50 hover:bg-char-700">
                <Link href="/personalizado">Pedir peça sob medida</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/**
 * O `about_md` das configurações alimenta a seção "A oficina": o primeiro bloco é
 * a headline, o último é o aforismo em itálico (só quando há corpo pelo meio) e
 * o resto é o texto corrido.
 */
function splitAbout(markdown?: string | null) {
  const blocks = (markdown ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const headline = blocks[0];
  if (!headline) return null;

  const rest = blocks.slice(1);
  const coda = rest.length > 1 ? rest.pop() : undefined;

  return { headline, body: rest.join("\n\n"), coda };
}
