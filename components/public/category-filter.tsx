import Link from "next/link";
import type { Category } from "@/db/schema";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  categories: Category[];
  active?: string;
};

export function CategoryFilter({ categories, active }: CategoryFilterProps) {
  const options = [{ slug: undefined, name: "Tudo" }, ...categories];

  return (
    <nav aria-label="Filtrar por categoria" className="flex flex-wrap items-center gap-3">
      {options.map((option) => {
        const selected = option.slug === active;
        return (
          <Link
            key={option.slug ?? "todos"}
            href={option.slug ? `/produtos?categoria=${option.slug}` : "/produtos"}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "rounded-sm border px-4 py-2 font-accent text-eyebrow tracking-caps uppercase transition-colors",
              selected
                ? "border-frame bg-brand/12 text-amber-500"
                : "border-border text-body hover:border-copper-600 hover:text-copper-300",
            )}
          >
            {option.name}
          </Link>
        );
      })}
    </nav>
  );
}
