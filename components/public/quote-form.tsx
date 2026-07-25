"use client";

import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { z } from "zod";
import { TurnstileBox, useTurnstile } from "@/components/public/turnstile";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitQuoteRequest } from "@/lib/mutations/quotes";
import { getSessionId } from "@/lib/session";
import { uploadToR2 } from "@/lib/upload-client";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_EXTENSIONS,
  formatBytes,
  MAX_FILE_BYTES,
  MAX_FILES,
  validateFileMeta,
} from "@/lib/uploads";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().trim().min(2, "Diz-nos o teu nome.").max(80),
  contact: z.string().trim().min(5, "Deixa um WhatsApp ou email.").max(120),
  message: z.string().trim().min(10, "Descreve a peça que tens em mente.").max(4000),
});

type FormValues = z.infer<typeof formSchema>;

type Attachment = {
  id: string;
  file: File;
  progress: number;
  state: "pendente" | "a enviar" | "enviado" | "erro" | "cancelado";
  error?: string;
  controller?: AbortController;
};

type Sent = { code: string; whatsappUrl: string | null };

export function QuoteForm({ siteKey }: { siteKey: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const { containerRef, ready, failed, getFreshToken } = useTurnstile(siteKey);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    setServerError(null);

    // Snapshot já: o updater do React corre depois de limparmos o value do
    // input, e nessa altura o FileList original já está vazio.
    const escolhidos = Array.from(incoming);

    setAttachments((current) => {
      const next = [...current];

      for (const file of escolhidos) {
        if (next.length >= MAX_FILES) break;
        if (next.some((a) => a.file.name === file.name && a.file.size === file.size)) continue;

        // Validação no cliente antes de sequer pedir uma assinatura.
        const rejection = validateFileMeta({
          filename: file.name,
          mime: file.type,
          sizeBytes: file.size,
        });

        next.push({
          id: crypto.randomUUID(),
          file,
          progress: 0,
          state: rejection ? "erro" : "pendente",
          error: rejection?.reason,
        });
      }

      return next;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      current.find((a) => a.id === id)?.controller?.abort();
      return current.filter((a) => a.id !== id);
    });
  }

  function cancelUpload(id: string) {
    setAttachments((current) => {
      const found = current.find((a) => a.id === id);
      found?.controller?.abort();
      return current.map((a) => (a.id === id ? { ...a, state: "cancelado", progress: 0 } : a));
    });
  }

  function patch(id: string, changes: Partial<Attachment>) {
    setAttachments((current) => current.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const invalid = attachments.find((a) => a.state === "erro");
    if (invalid) {
      setServerError(invalid.error ?? "Há um ficheiro inválido na lista.");
      return;
    }

    const toUpload = attachments.filter((a) => a.state !== "cancelado");

    try {
      let code: string | null = null;
      const uploaded: Array<{ key: string; filename: string; mime: string; sizeBytes: number }> =
        [];

      if (toUpload.length > 0) {
        const presignToken = await getFreshToken();

        const response = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            turnstileToken: presignToken,
            files: toUpload.map((a) => ({
              filename: a.file.name,
              mime: a.file.type,
              sizeBytes: a.file.size,
            })),
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          code?: string;
          uploads?: Array<{ filename: string; key: string; contentType: string; url: string }>;
        };

        if (!response.ok || !payload.code || !payload.uploads) {
          setServerError(payload.error ?? "Não foi possível preparar o envio dos ficheiros.");
          return;
        }

        code = payload.code;

        for (const [index, attachment] of toUpload.entries()) {
          const target = payload.uploads[index];
          if (!target) continue;

          const controller = new AbortController();
          patch(attachment.id, { state: "a enviar", progress: 0, controller });

          try {
            await uploadToR2({
              url: target.url,
              file: attachment.file,
              contentType: target.contentType,
              onProgress: (percent) => patch(attachment.id, { progress: percent }),
              signal: controller.signal,
            });

            patch(attachment.id, { state: "enviado", progress: 100 });
            uploaded.push({
              key: target.key,
              filename: attachment.file.name,
              mime: attachment.file.type,
              sizeBytes: attachment.file.size,
            });
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              patch(attachment.id, { state: "cancelado", progress: 0 });
              continue;
            }
            patch(attachment.id, {
              state: "erro",
              error: error instanceof Error ? error.message : "O upload falhou.",
            });
            setServerError("Um dos ficheiros não subiu. Remove-o ou tenta de novo.");
            return;
          }
        }
      }

      const submitToken = await getFreshToken();

      const result = await submitQuoteRequest({
        ...values,
        turnstileToken: submitToken,
        sessionId: getSessionId(),
        code: uploaded.length > 0 ? code : null,
        files: uploaded,
      });

      if (!result.ok) {
        setServerError(result.error);
        return;
      }

      setSent({ code: result.code, whatsappUrl: result.whatsappUrl });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Não foi possível enviar. Tenta de novo.",
      );
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-md border border-border p-8">
        <CopperRule />
        <Eyebrow>Pedido recebido</Eyebrow>
        <h2 className="font-display text-h2 font-bold text-display">Guarda este código.</h2>
        <code className="rounded-sm border border-border bg-char-700 px-4 py-2 font-mono text-base text-display">
          {sent.code}
        </code>
        <p className="text-small text-subtle">
          Vamos ver o teu pedido e responder pelo contacto que deixaste. Prazos e valores são
          combinados na conversa.
        </p>
        {sent.whatsappUrl ? (
          <Button asChild>
            <a href={sent.whatsappUrl} target="_blank" rel="noreferrer noopener">
              Falar no WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    );
  }

  const cheio = attachments.length >= MAX_FILES;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${fieldId}-nome`}>Nome</Label>
        <Input
          id={`${fieldId}-nome`}
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name ? (
          <p role="alert" className="text-small text-danger">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${fieldId}-contacto`}>Contato</Label>
        <Input
          id={`${fieldId}-contacto`}
          placeholder="WhatsApp ou email"
          aria-invalid={!!errors.contact}
          {...register("contact")}
        />
        {errors.contact ? (
          <p role="alert" className="text-small text-danger">
            {errors.contact.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${fieldId}-mensagem`}>A peça</Label>
        <Textarea
          id={`${fieldId}-mensagem`}
          rows={6}
          placeholder="Descreve o que tens em mente."
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        {errors.message ? (
          <p role="alert" className="text-small text-danger">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor={`${fieldId}-ficheiros`}>Ficheiros (opcional)</Label>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-6 py-10 text-center transition-colors",
            dragging && "border-copper-500 bg-brand/8",
          )}
        >
          <Upload aria-hidden="true" strokeWidth={1.5} className="size-6 text-subtle" />
          <p className="text-small text-subtle">Arrasta os ficheiros para aqui, ou escolhe-os.</p>
          <input
            ref={inputRef}
            id={`${fieldId}-ficheiros`}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cheio}
            onClick={() => inputRef.current?.click()}
          >
            Escolher ficheiros
          </Button>
          <p className="text-small text-subtle">
            Até {MAX_FILES} ficheiros, {MAX_FILE_BYTES / 1024 / 1024} MB cada.{" "}
            {ALLOWED_EXTENSIONS.join(", ")}.
          </p>
        </div>

        {attachments.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {attachments.map((attachment) => (
              <li key={attachment.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-small text-body">{attachment.file.name}</p>
                    <p className="text-small text-subtle">
                      {formatBytes(attachment.file.size)} · {attachment.state}
                    </p>
                    {attachment.error ? (
                      <p className="text-small text-danger">{attachment.error}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {attachment.state === "a enviar" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => cancelUpload(attachment.id)}
                      >
                        Cancelar
                      </Button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      aria-label={`Remover ${attachment.file.name}`}
                      className="p-1 text-subtle hover:text-danger"
                    >
                      <X aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    </button>
                  </div>
                </div>

                {attachment.state === "a enviar" || attachment.state === "enviado" ? (
                  <div
                    role="progressbar"
                    aria-valuenow={attachment.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso de ${attachment.file.name}`}
                    className="h-1 w-full overflow-hidden rounded-full bg-char-700"
                  >
                    <div
                      className="h-full bg-brand transition-[width]"
                      style={{ width: `${attachment.progress}%` }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <TurnstileBox containerRef={containerRef} />
        {failed ? (
          <p role="alert" className="text-small text-danger">
            A verificação anti-spam não carregou. Recarrega a página.
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p role="alert" className="text-small text-danger">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting || !ready}>
        {isSubmitting ? "A enviar…" : "Enviar pedido"}
      </Button>

      <p className="text-small text-subtle">
        Não perguntamos quantidade, material nem prazo — isso combina-se na conversa.
      </p>
    </form>
  );
}
