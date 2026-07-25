"use client";

// Cliente porque @radix-ui/react-slot chama createContext sem trazer a própria
// directiva, e rebenta ao ser avaliado no ambiente react-server.

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui/slot";

import { cn } from "@/lib/utils";

// Adaptado ao DESIGN.md (secção 5): font-accent em caixa alta com tracking-caps,
// cantos de 3px, transições de 120ms, hover em cobre mais claro e press em cobre
// mais escuro. Os nomes das variantes são os do shadcn, para não partir os
// componentes que dependem deles.
const buttonVariants = cva(
  "group/button font-accent tracking-caps inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent whitespace-nowrap uppercase transition-colors duration-[120ms] outline-none select-none focus-visible:shadow-(--focus-ring) disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand text-char-900 hover:bg-brand-hover active:bg-brand-press",
        outline:
          "border-frame text-amber-500 hover:bg-brand/12 hover:text-amber-500 bg-transparent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-body hover:bg-accent hover:text-display bg-transparent",
        destructive: "bg-destructive text-cream-50 hover:bg-destructive/85",
        link: "text-amber-500 hover:text-copper-300 tracking-normal normal-case underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-[11px] text-[13px] leading-none",
        sm: "px-4 py-2 text-[12px] leading-none",
        lg: "px-8 py-[14px] text-[15px] leading-none",
        xs: "px-3 py-1.5 text-[11px] leading-none",
        icon: "size-9 p-0",
        "icon-xs": "size-7 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
