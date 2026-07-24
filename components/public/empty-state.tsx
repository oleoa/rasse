import { CopperRule } from "@/components/public/typography";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      <CopperRule />
      <p className="font-display text-h3 font-bold text-display">{title}</p>
      {description ? <p className="max-w-[48ch] text-small text-subtle">{description}</p> : null}
      {action}
    </div>
  );
}
