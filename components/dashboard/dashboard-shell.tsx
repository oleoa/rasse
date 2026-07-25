"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { breadcrumbsFor, DASHBOARD_NAV } from "@/components/dashboard/sidebar-nav";
import { CopperRule } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardShell({
  user,
  novos,
  onSignOut,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  /** Contagem por href, para o badge de "novos" na sidebar. */
  novos: Record<string, number>;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const trilho = breadcrumbsFor(pathname);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <a
        href="#conteudo"
        className="sr-only bg-card text-display focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:px-4 focus:py-2"
      >
        Saltar para o conteúdo
      </a>

      <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link
          href="/dashboard"
          className="font-display text-h3 font-bold tracking-caps text-display"
        >
          RASSË
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="navegacao-painel"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="p-2 text-body hover:text-copper-300"
        >
          {open ? (
            <X aria-hidden="true" strokeWidth={1.5} className="size-5" />
          ) : (
            <Menu aria-hidden="true" strokeWidth={1.5} className="size-5" />
          )}
        </button>
      </header>

      <aside
        id="navegacao-painel"
        className={cn(
          "flex-col gap-6 border-b border-border bg-sidebar p-4 lg:flex lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-6",
          open ? "flex" : "hidden",
        )}
      >
        <Link
          href="/dashboard"
          className="hidden font-display text-h3 font-bold tracking-caps text-display lg:block"
        >
          RASSË
        </Link>
        <CopperRule className="hidden lg:block" />

        <nav aria-label="Secções do painel" className="flex flex-col gap-1">
          {DASHBOARD_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-2 font-accent text-eyebrow tracking-caps uppercase transition-colors",
                isActive(item.href)
                  ? "bg-brand/12 text-amber-500"
                  : "text-body hover:bg-accent hover:text-display",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                {item.label}
                {novos[item.href] ? (
                  <span
                    className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 font-accent text-[10px] leading-none text-char-900"
                    aria-label={`${novos[item.href]} por ver`}
                  >
                    {novos[item.href]}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="truncate text-small text-body">{user.name ?? "Administrador"}</p>
            <p className="truncate text-small text-subtle">{user.email}</p>
          </div>
          <form action={onSignOut}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOut aria-hidden="true" strokeWidth={1.5} />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav aria-label="Trilho" className="border-b border-border px-4 py-3 lg:px-8">
          <ol className="flex flex-wrap items-center gap-2">
            {trilho.map((passo, index) => (
              <li key={passo.href} className="flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-small text-subtle">
                    ·
                  </span>
                ) : null}
                {index === trilho.length - 1 ? (
                  <span
                    aria-current="page"
                    className="font-accent text-eyebrow tracking-caps text-display uppercase"
                  >
                    {passo.label}
                  </span>
                ) : (
                  <Link
                    href={passo.href}
                    className="font-accent text-eyebrow tracking-caps text-subtle uppercase hover:text-copper-300"
                  >
                    {passo.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <main id="conteudo" className="flex-1 px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
