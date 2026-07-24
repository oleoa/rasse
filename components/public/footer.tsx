import Link from "next/link";
import { Container } from "@/components/public/container";
import { NAV_LINKS } from "@/components/public/nav-links";
import { CopperRule } from "@/components/public/typography";

type FooterProps = {
  businessName?: string;
  instagramUrl?: string | null;
  contactEmail?: string | null;
};

export function Footer({
  businessName = "Oficina Rassë",
  instagramUrl,
  contactEmail,
}: FooterProps) {
  return (
    <footer className="mt-16 border-t border-border">
      <Container className="flex flex-col items-center gap-6 py-12 text-center sm:py-16">
        <CopperRule />

        <div className="flex flex-col gap-2">
          <p className="font-display text-h3 font-bold tracking-caps text-display">RASSË</p>
          <p className="font-accent text-eyebrow tracking-eyebrow text-subtle uppercase">
            Oficina · Ateliê · Estúdio
          </p>
        </div>

        <nav
          aria-label="Navegação do rodapé"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-accent text-eyebrow tracking-caps text-body uppercase hover:text-copper-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {instagramUrl || contactEmail ? (
          <p className="text-small text-subtle">
            {instagramUrl ? (
              <a href={instagramUrl} target="_blank" rel="noreferrer noopener">
                Instagram
              </a>
            ) : null}
            {instagramUrl && contactEmail ? <span aria-hidden="true"> · </span> : null}
            {contactEmail ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : null}
          </p>
        ) : null}

        <p className="text-small text-subtle">{businessName}</p>
      </Container>
    </footer>
  );
}
