"use client";

/**
 * PUT directo para o R2 com barra de progresso e cancelamento.
 *
 * XMLHttpRequest e não `fetch`: só o XHR reporta progresso de upload. O corpo do
 * ficheiro nunca passa pela Vercel — vai do browser para o bucket.
 */
export function uploadToR2(options: {
  url: string;
  file: File;
  contentType: string;
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}): Promise<void> {
  const { url, file, contentType, onProgress, signal } = options;

  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Cancelado", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("content-type", contentType);

    const onAbort = () => xhr.abort();
    signal.addEventListener("abort", onAbort, { once: true });

    const cleanup = () => signal.removeEventListener("abort", onAbort);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`O upload falhou (${xhr.status}).`));
      }
    });

    xhr.addEventListener("error", () => {
      cleanup();
      reject(new Error("O upload falhou. Verifica a ligação."));
    });

    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new DOMException("Cancelado", "AbortError"));
    });

    xhr.send(file);
  });
}
