import * as React from "react";

import { cn } from "@/lib/utils";

// Mesmo tratamento de campo do Input — ver DESIGN.md, seção 5.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-char-700 text-body font-body placeholder:text-subtle focus-visible:border-copper-500 focus-visible:shadow-(--focus-ring) disabled:bg-char-800 aria-invalid:border-destructive field-sizing-content flex min-h-24 w-full rounded-sm border px-3.5 py-2.5 text-[15px] leading-[1.6] transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
