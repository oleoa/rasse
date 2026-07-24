/**
 * Mensagem de WhatsApp — formato fixo do CLAUDE.md, secção 6. Sem emojis.
 *
 * Olá! Tenho interesse nestes produtos:
 *
 * • 2x Tábua Churrasco (Média)
 * • 1x Suporte 3D — a combinar
 *
 * Código do pedido: RS-K7M4QP92
 */

export const MAX_MESSAGE_LENGTH = 1500;

export type WhatsappItem = {
  quantity: number;
  name: string;
  variantName?: string | null;
  onRequest: boolean;
};

const HEADER = "Olá! Tenho interesse nestes produtos:";

function itemLine(item: WhatsappItem): string {
  const variant = item.variantName ? ` (${item.variantName})` : "";
  const suffix = item.onRequest ? " — a combinar" : "";
  return `• ${item.quantity}x ${item.name}${variant}${suffix}`;
}

export function buildWhatsappMessage(items: WhatsappItem[], code: string): string {
  const footer = `Código do pedido: ${code}`;
  const lines = items.map(itemLine);

  const compose = (shown: string[], hidden: number) => {
    const body = hidden > 0 ? [...shown, `…e mais ${hidden} itens (ver pelo código)`] : shown;
    return [HEADER, "", ...body, "", footer].join("\n");
  };

  let message = compose(lines, 0);
  let shown = lines.length;

  // Corta a lista pelo fim até caber no limite, mantendo cabeçalho e código.
  while (message.length > MAX_MESSAGE_LENGTH && shown > 1) {
    shown -= 1;
    message = compose(lines.slice(0, shown), lines.length - shown);
  }

  return message;
}

/** O número tem de vir só com dígitos, no formato internacional. */
export function whatsappUrl(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
