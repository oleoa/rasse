"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imageUrl, isUnoptimized } from "@/lib/images";
import { uploadToR2 } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

export type ImageDraft = {
  id: string | null;
  r2Key: string;
  alt: string;
  width: number;
  height: number;
  /** Só no cliente, para a barra de progresso. */
  progresso?: number;
};

const MAX_IMAGENS = 12;

async function medir(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * A primeira imagem da lista é a capa — é a que vai para o cartão do catálogo e
 * para o Open Graph. Reordenar é o que define a capa.
 */
export function ProductImages({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: ImageDraft[];
  onChange: (images: ImageDraft[]) => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function adicionar(lista: FileList | null) {
    if (!lista) return;
    const arquivos = Array.from(lista).slice(0, MAX_IMAGENS - images.length);
    if (arquivos.length === 0) return;

    setErro(null);
    setAEnviar(true);

    try {
      const response = await fetch("/api/uploads/produtos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          files: arquivos.map((f) => ({ filename: f.name, mime: f.type, sizeBytes: f.size })),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        uploads?: Array<{ key: string; contentType: string; url: string }>;
      };

      if (!response.ok || !payload.uploads) {
        setErro(payload.error ?? "Não foi possível preparar o envio.");
        return;
      }

      const novas: ImageDraft[] = [];

      for (const [index, file] of arquivos.entries()) {
        const alvo = payload.uploads[index];
        if (!alvo) continue;

        const dimensoes = await medir(file);
        await uploadToR2({
          url: alvo.url,
          file,
          contentType: alvo.contentType,
          onProgress: () => {},
          signal: new AbortController().signal,
        });

        novas.push({ id: null, r2Key: alvo.key, alt: "", ...dimensoes });
      }

      onChange([...images, ...novas]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "O envio falhou.");
    } finally {
      setAEnviar(false);
    }
  }

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= images.length) return;
    const copia = [...images];
    const [item] = copia.splice(index, 1);
    if (item) copia.splice(destino, 0, item);
    onChange(copia);
  }

  function definirCapa(index: number) {
    if (index === 0) return;
    const copia = [...images];
    const [item] = copia.splice(index, 1);
    if (item) copia.unshift(item);
    onChange(copia);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.avif"
          className="sr-only"
          onChange={(event) => {
            void adicionar(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          carregando={aEnviar}
          disabled={aEnviar || images.length >= MAX_IMAGENS}
          onClick={() => inputRef.current?.click()}
        >
          {aEnviar ? "Enviando…" : "Adicionar imagens"}
        </Button>
        <span className="text-small text-subtle">
          {images.length}/{MAX_IMAGENS} · a primeira é a capa
        </span>
      </div>

      {erro ? (
        <p role="alert" className="text-small text-danger">
          {erro}
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="text-small text-subtle">Ainda não há imagens.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {images.map((imagem, index) => (
            <li
              key={imagem.r2Key}
              className={cn(
                "flex gap-4 rounded-md border border-border p-3",
                index === 0 && "border-copper-600",
              )}
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-sm bg-char-700">
                <Image
                  src={imageUrl(imagem.r2Key)}
                  alt=""
                  fill
                  unoptimized={isUnoptimized(imagem.r2Key)}
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-accent text-eyebrow tracking-caps text-subtle uppercase">
                    {index === 0 ? "Capa" : `Imagem ${index + 1}`} · {imagem.width}×{imagem.height}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => definirCapa(index)}
                      disabled={index === 0}
                      aria-label="Definir como capa"
                      className="p-1 text-subtle hover:text-amber-500 disabled:opacity-30"
                    >
                      <Star aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(index, -1)}
                      disabled={index === 0}
                      aria-label="Mover para trás"
                      className="p-1 text-subtle hover:text-copper-300 disabled:opacity-30"
                    >
                      <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label="Mover para a frente"
                      className="p-1 text-subtle hover:text-copper-300 disabled:opacity-30"
                    >
                      <ArrowRight aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(images.filter((_, i) => i !== index))}
                      aria-label="Remover imagem"
                      className="p-1 text-subtle hover:text-danger"
                    >
                      <X aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor={`alt-${index}`}>Texto alternativo (obrigatório)</Label>
                  <Input
                    id={`alt-${index}`}
                    value={imagem.alt}
                    maxLength={160}
                    aria-invalid={imagem.alt.trim().length === 0}
                    placeholder="Descreva a imagem para quem não a vê"
                    onChange={(event) =>
                      onChange(
                        images.map((img, i) =>
                          i === index ? { ...img, alt: event.target.value } : img,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
