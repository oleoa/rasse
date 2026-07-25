"use client";

// Cliente pela mesma razão do Button: @radix-ui/react-slot usa createContext.

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui/slot";

import { cn } from "@/lib/utils";

// DESIGN.md, seção 5: font-accent 11px caixa alta tracked, cantos em pílula
// (o único caso), fundo de cobre a 14% e texto em âmbar.
const badgeVariants = cva(
  "group/badge font-accent tracking-caps inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-[11px] leading-none whitespace-nowrap uppercase transition-colors focus-visible:shadow-(--focus-ring) [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-brand/14 text-amber-500",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/15 text-destructive",
        success: "bg-success/15 text-success",
        outline: "border-border text-body",
        ghost: "text-subtle",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
