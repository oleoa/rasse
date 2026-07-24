"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { NAV_LINKS } from "@/components/public/nav-links";
import { CopperRule } from "@/components/public/typography";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menu"
        className="inline-flex items-center p-2 text-body hover:text-copper-300 md:hidden"
      >
        <Menu aria-hidden="true" strokeWidth={1.5} className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-card">
        <SheetHeader>
          <SheetTitle className="font-display text-h3 tracking-caps text-display">RASSË</SheetTitle>
        </SheetHeader>
        <CopperRule className="mx-4" />
        <nav className="flex flex-col px-4 py-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-border py-4 font-accent text-small tracking-caps text-body uppercase last:border-b-0 hover:text-copper-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
