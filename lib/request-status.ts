/**
 * Rótulos e estilos dos estados de pedidos e orçamentos.
 *
 * Vive fora de `lib/queries/requests.ts` porque isso é `server-only` e estes
 * valores são precisos também nos componentes de cliente.
 */

export type RequestStatus = "novo" | "contactado" | "fechado" | "perdido";

export const REQUEST_STATUSES: readonly RequestStatus[] = [
  "novo",
  "contactado",
  "fechado",
  "perdido",
];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  novo: "Novo",
  contactado: "Contactado",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const STATUS_VARIANT: Record<RequestStatus, "default" | "secondary" | "success" | "ghost"> =
  {
    novo: "default",
    contactado: "secondary",
    fechado: "success",
    perdido: "ghost",
  };
