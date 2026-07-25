import Image from "next/image";
import Link from "next/link";
import { Accent, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";

/**
 * Hero full-bleed da home: fotografia de montanha ao amanhecer, gradiente de
 * proteção na base e a moldura de cobre da marca. A barra de navegação flutua
 * por cima — ver `header.tsx`.
 *
 * Foto provisória de ZUMRAD NORMATOVA (Pexels), à espera de fotografia própria
 * da oficina — ver BLOCKERS.md.
 */
export function HomeHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="frame relative flex min-h-dvh flex-col overflow-hidden bg-char-900">
      <Image src="/hero-montanha.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      {/* O céu da foto é claro. O gradiente do desenho (0,33 → 0,21 → 0,6) deixava
          o creme a 2,9:1 e o cobre da headline abaixo de 3:1; a esta densidade
          ficam em 9,6:1 e 3,5:1, e a foto continua legível. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,16,11,0.72)_0%,rgba(21,16,11,0.68)_50%,rgba(21,16,11,0.88)_100%)]"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
        {/* Creme e não cobre: a 12px sobre a foto o cobre não passa os 4,5:1. */}
        <Eyebrow className="mb-6 text-cream-100">Oficina · Ateliê · Estúdio</Eyebrow>

        <h1 className="max-w-[14ch] font-display text-hero-xl font-bold text-balance text-cream-50">
          {withAccentedLastWord(title)}
        </h1>

        {subtitle ? (
          <p className="mt-6 max-w-[44ch] text-[clamp(17px,1.6vw,21px)] leading-[1.6] text-cream-100">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/produtos">Ver o catálogo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/personalizado">Pedir peça sob medida</Link>
          </Button>
        </div>
      </div>

      <p className="relative pb-9 text-center font-accent text-[11px] tracking-eyebrow text-stone-400 uppercase">
        Feito para durar.
      </p>
    </section>
  );
}

/** A última palavra do título fica em cobre — ver DESIGN.md, seção 3. */
export function withAccentedLastWord(title: string) {
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
