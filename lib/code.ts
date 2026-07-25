const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LENGTH = 8;
const PREFIX = "RS-";

export const CODE_PATTERN = new RegExp(`^${PREFIX}[${ALPHABET}]{${LENGTH}}$`);

/**
 * Rejeita os bytes que caem na cauda incompleta do último ciclo do alfabeto,
 * para que todos os caracteres tenham a mesma probabilidade.
 */
function randomIndex(): number {
  const limit = 256 - (256 % ALPHABET.length);
  const buffer = new Uint8Array(1);

  for (;;) {
    crypto.getRandomValues(buffer);
    const byte = buffer[0]!;
    if (byte < limit) return byte % ALPHABET.length;
  }
}

export function generateCode(): string {
  let body = "";
  for (let i = 0; i < LENGTH; i += 1) {
    body += ALPHABET[randomIndex()];
  }
  return `${PREFIX}${body}`;
}

export function isValidCode(value: string): boolean {
  return CODE_PATTERN.test(value);
}

/**
 * Gera um código garantidamente livre. `isTaken` é fornecido por quem chama
 * (camada de mutations), para que este módulo não dependa do banco de dados.
 */
export async function generateUniqueCode(
  isTaken: (code: string) => Promise<boolean>,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateCode();
    if (!(await isTaken(code))) return code;
  }

  throw new Error(`Não foi possível gerar um código único em ${maxAttempts} tentativas.`);
}
