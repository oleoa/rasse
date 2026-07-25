"use client";

import { useState, useTransition } from "react";
import { Download, FileImage, FileText, Box, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuoteFileUrl } from "@/lib/mutations/requests";
import { extensionOf, formatBytes } from "@/lib/uploads";

export type QuoteFileRow = {
  id: string;
  filename: string;
  mime: string;
  sizeBytes: number;
};

const MODELOS_3D = new Set(["stl", "3mf", "obj", "step", "stp"]);
const IMAGENS = new Set(["png", "jpg", "jpeg", "webp", "svg"]);

function Icone({ filename }: { filename: string }) {
  const ext = extensionOf(filename);
  const props = { "aria-hidden": true, strokeWidth: 1.5, className: "size-5 text-subtle" } as const;

  if (MODELOS_3D.has(ext)) return <Box {...props} />;
  if (IMAGENS.has(ext)) return <FileImage {...props} />;
  if (ext === "pdf" || ext === "ai") return <FileText {...props} />;
  return <FileIcon {...props} />;
}

export function QuoteFiles({ code, files }: { code: string; files: QuoteFileRow[] }) {
  const [erro, setErro] = useState<string | null>(null);
  const [previa, setPrevia] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  function descarregar(fileId: string) {
    setErro(null);

    iniciar(async () => {
      const r = await getQuoteFileUrl({ code, fileId });
      if (!r.ok) {
        setErro(r.error);
        return;
      }

      // O URL assinado vem com Content-Disposition: attachment, por isso isto
      // arranca o download sem sair da página. Um window.open depois de um
      // await seria bloqueado pelo browser, e deixaria uma aba vazia para trás.
      window.location.href = r.data.url;
    });
  }

  function verPrevia(fileId: string) {
    setErro(null);
    iniciar(async () => {
      const r = await getQuoteFileUrl({ code, fileId });
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      setPrevia((p) => ({ ...p, [fileId]: r.data.url }));
    });
  }

  if (files.length === 0) {
    return <p className="text-small text-subtle">Este pedido não trouxe ficheiros.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border">
        {files.map((ficheiro) => {
          const ext = extensionOf(ficheiro.filename);
          const podeVer = IMAGENS.has(ext) && ext !== "svg";

          return (
            <li key={ficheiro.id} className="flex flex-col gap-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Icone filename={ficheiro.filename} />
                  <div className="min-w-0">
                    <p className="truncate text-small text-body">{ficheiro.filename}</p>
                    <p className="text-small text-subtle">
                      {formatBytes(ficheiro.sizeBytes)} · {ficheiro.mime}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {podeVer && !previa[ficheiro.id] ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pendente}
                      onClick={() => verPrevia(ficheiro.id)}
                    >
                      Ver
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pendente}
                    onClick={() => descarregar(ficheiro.id)}
                  >
                    <Download aria-hidden="true" strokeWidth={1.5} />
                    Descarregar
                  </Button>
                </div>
              </div>

              {previa[ficheiro.id] ? (
                // URL assinado de 15 minutos; não passa pelo optimizador do Next.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previa[ficheiro.id]}
                  alt={ficheiro.filename}
                  className="max-h-80 w-auto rounded-sm border border-border"
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {erro ? (
        <p role="alert" className="text-small text-danger">
          {erro}
        </p>
      ) : null}

      <p className="text-small text-subtle">
        Os links de download expiram em 15 minutos e só funcionam com sessão iniciada.
      </p>
    </div>
  );
}
