import Link from "next/link";
import { CartDrawer } from "@/components/public/cart-drawer";
import { Container } from "@/components/public/container";
import { MobileNav } from "@/components/public/mobile-nav";
import { NAV_LINKS } from "@/components/public/nav-links";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <MobileNav />
          <Link
            href="/"
            className="font-display text-h3 font-bold tracking-caps text-display hover:text-display"
          >
            RASSË
          </Link>
        </div>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
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

        <CartDrawer />
      </Container>
    </header>
  );
}
