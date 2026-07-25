/**
 * Rótulos e estilos dos estados de pedidos e orçamentos.
 *
 * Vive fora de `lib/queries/requests.ts` porque isso é `server-only` e estes
 * valores também são necessários nos componentes de cliente.
 */

export type RequestStatus = "novo" | "contatado" | "fechado" | "perdido";

export const REQUEST_STATUSES: readonly RequestStatus[] = [
  "novo",
  "contatado",
  "fechado",
  "perdido",
];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const STATUS_VARIANT: Record<RequestStatus, "default" | "secondary" | "success" | "ghost"> =
  {
    novo: "default",
    contatado: "secondary",
    fechado: "success",
    perdido: "ghost",
  };
