"use client";

const KEY = "rasse-sessao";

/**
 * Identificador de sessão para analytics: um uuid em `sessionStorage`, sem
 * cookies — ver CLAUDE.md, seção 6. A Fase 9 usa o mesmo valor no `/api/track`.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.sessionStorage.getItem(KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    // sessionStorage bloqueado (modo privado antigo, políticas do navegador).
    return crypto.randomUUID();
  }
}
