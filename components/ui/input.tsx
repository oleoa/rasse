import * as React from "react";

import { cn } from "@/lib/utils";

// Adaptado ao DESIGN.md (seção 5): fundo char-700, borda sutil, cantos de 3px,
// padding 10px 14px, corpo a 15px, foco com borda de cobre e --focus-ring.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-char-700 text-body font-body placeholder:text-subtle focus-visible:border-copper-500 focus-visible:shadow-(--focus-ring) disabled:bg-char-800 aria-invalid:border-destructive w-full min-w-0 rounded-sm border px-3.5 py-2.5 text-[15px] transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
