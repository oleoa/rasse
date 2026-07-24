import { cn } from "@/lib/utils";

export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-accent text-eyebrow tracking-eyebrow text-subtle uppercase", className)}
      {...props}
    />
  );
}

/** A palavra em cobre da headline. Uma por bloco — ver DESIGN.md. */
export function Accent({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("text-amber-500 italic", className)} {...props} />;
}

export function CopperRule({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("rule-copper", className)} {...props} />;
}

export function Prose({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("max-w-[68ch] leading-[1.6] text-body", className)} {...props} />;
}
