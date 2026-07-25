"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileOptions = {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  language?: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TOKEN_TIMEOUT_MS = 20000;

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    const script = existing ?? document.createElement("script");

    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Turnstile não carregou.")));

    if (!existing) {
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
}

/**
 * Os tokens do Turnstile são de uso único, e este formulário precisa de dois:
 * um para assinar os uploads e outro para submeter. Daí `getFreshToken`, que
 * reinicia o widget e espera por um token novo.
 */
export function useTurnstile(siteKey: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const pending = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetId.current) return;

        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          language: "pt-br",
          callback: (token) => {
            pending.current?.resolve(token);
            pending.current = null;
          },
          "error-callback": () => {
            pending.current?.reject(new Error("A verificação anti-spam falhou."));
            pending.current = null;
            setFailed(true);
          },
          "expired-callback": () => {
            pending.current?.reject(new Error("A verificação anti-spam expirou."));
            pending.current = null;
          },
        });

        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      const id = widgetId.current;
      if (id && window.turnstile) {
        window.turnstile.remove(id);
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  const getFreshToken = useCallback(async (): Promise<string> => {
    const id = widgetId.current;
    if (!id || !window.turnstile) {
      throw new Error("A verificação anti-spam ainda não carregou. Espere um instante.");
    }

    return new Promise<string>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        pending.current = null;
        reject(new Error("A verificação anti-spam demorou demais. Tente de novo."));
      }, TOKEN_TIMEOUT_MS);

      pending.current = {
        resolve: (token) => {
          window.clearTimeout(timer);
          resolve(token);
        },
        reject: (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      };

      window.turnstile!.reset(id);
    });
  }, []);

  return { containerRef, ready, failed, getFreshToken };
}

export function TurnstileBox({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return <div ref={containerRef} className="min-h-[65px]" />;
}
