const DIACRITICOS = /[̀-ͯ]/g;

function base(value: string): string {
  return value.normalize("NFD").replace(DIACRITICOS, "").toLowerCase();
}

/**
 * Slug final: "Tábua de Churrasco" fica "tabua-de-churrasco". Usar ao gerar a
 * partir do nome, ao sair do campo, e antes de gravar.
 */
export function slugify(value: string): string {
  return base(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Normalização enquanto se escreve. Mantém o hífen no fim — cortá-lo a cada
 * tecla tornava impossível escrever "tabua-de-corte" à mão, porque o hífen
 * desaparecia antes da letra seguinte chegar.
 */
export function slugifyWhileTyping(value: string): string {
  return base(value)
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return value.length > 0 && value.length <= 80 && SLUG_PATTERN.test(value);
}
