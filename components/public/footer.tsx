import Link from "next/link";
import { Container } from "@/components/public/container";
import { NAV_LINKS } from "@/components/public/nav-links";

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
    <footer className="mt-16 border-t border-border bg-char-900">
      <Container className="pt-18 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div>
            <p className="font-display text-h3 font-bold tracking-caps text-display">RASSË</p>
            <p className="mt-2.5 font-accent text-[11px] tracking-eyebrow text-subtle uppercase">
              Oficina · Ateliê · Estúdio
            </p>
          </div>

          <nav
            aria-label="Navegação do rodapé"
            className="flex flex-wrap gap-x-9 gap-y-3 font-accent text-eyebrow tracking-caps uppercase"
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-body hover:text-copper-300">
                {link.label}
              </Link>
            ))}
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-body hover:text-copper-300"
              >
                Instagram
              </a>
            ) : null}
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-small text-subtle">
          <p>
            {businessName}
            {contactEmail ? (
              <>
                <span aria-hidden="true" className="text-copper-600">
                  {" · "}
                </span>
                <a href={`mailto:${contactEmail}`} className="text-subtle hover:text-copper-300">
                  {contactEmail}
                </a>
              </>
            ) : null}
          </p>

          <nav aria-label="Legal" className="flex items-center gap-3">
            <Link href="/legal/privacidade" className="text-subtle hover:text-copper-300">
              Política de Privacidade
            </Link>
            <span aria-hidden="true" className="text-copper-600">
              ·
            </span>
            <Link href="/legal/termos" className="text-subtle hover:text-copper-300">
              Termos de Uso
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
