"use client";

// Cliente por causa do estado de sobreposição: na home a barra flutua por cima
// do hero full-bleed, transparente, e só ganha fundo depois de o hero sair do
// tela. Nas restantes rotas é a barra sólida de sempre.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/public/cart-drawer";
import { Container } from "@/components/public/container";
import { MobileNav } from "@/components/public/mobile-nav";
import { NAV_LINKS } from "@/components/public/nav-links";
import { cn } from "@/lib/utils";

export function Header() {
  const isHome = usePathname() === "/";
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;

    const update = () => setPastHero(window.scrollY > window.innerHeight * 0.7);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome]);

  const overlay = isHome && !pastHero;

  return (
    <header
      className={cn(
        "z-40 transition-colors",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        overlay
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border bg-background/95 backdrop-blur",
      )}
    >
      <Container
        className={cn("flex items-center justify-between gap-4", isHome ? "h-16 md:h-20" : "h-16")}
      >
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
