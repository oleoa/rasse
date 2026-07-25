import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * A escala de texto da marca (`text-eyebrow`, `text-h1`, …) não existe no
 * Tailwind por padrão. Sem a declarar, o tailwind-merge lê estas classes como
 * cor e remove as anteriores sempre que a mesma chamada traz um `text-<cor>` — por exemplo
 * `text-h1 text-display` perdia o tamanho.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["eyebrow", "small", "h3", "h2", "h1", "hero", "hero-xl"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
