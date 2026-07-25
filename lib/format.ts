const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const DATE_SP = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_SP = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Centavos inteiros para "R$ 1.234,50". O espaço é fino e inquebrável, vem do ICU. */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

/** Data em UTC no banco de dados, apresentada em America/Sao_Paulo. */
export function formatDate(date: Date): string {
  return DATE_SP.format(date);
}

export function formatDateTime(date: Date): string {
  return DATE_TIME_SP.format(date);
}
