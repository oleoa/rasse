import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-respirar rounded-sm bg-char-700", className)}
      {...props}
    />
  );
}

export { Skeleton };
