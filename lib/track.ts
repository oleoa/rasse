"use client";

import { getSessionId } from "@/lib/session";

export type TrackableEvent = "page_view" | "product_view" | "add_to_cart";

/**
 * `sendBeacon` para o pedido sobreviver a sair da página. Sem cookies: a
 * identidade é o uuid de `sessionStorage`.
 */
export function track(type: TrackableEvent, options: { productId?: string | null } = {}): void {
  if (typeof window === "undefined") return;

  const corpo = JSON.stringify({
    type,
    productId: options.productId ?? null,
    sessionId: getSessionId(),
    path: window.location.pathname,
    referrer: document.referrer || null,
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([corpo], { type: "text/plain" }));
      return;
    }
    void fetch("/api/track", { method: "POST", body: corpo, keepalive: true });
  } catch {
    // Analytics nunca pode partir a página.
  }
}
