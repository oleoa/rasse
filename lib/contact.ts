/**
 * O contacto do orçamento é texto livre — pode ser um número ou um email. Só
 * oferecemos o botão do WhatsApp quando parece mesmo um número brasileiro.
 */
export function whatsappFromContact(contact: string): string | null {
  if (contact.includes("@")) return null;

  const digitos = contact.replace(/\D/g, "");

  // 10 ou 11 dígitos: número nacional, falta o código do país.
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;

  // 12 ou 13 já com o 55 à frente.
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return digitos;

  return null;
}
