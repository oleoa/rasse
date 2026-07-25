"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateRequest } from "@/lib/mutations/requests";
import { STATUS_LABEL, type RequestStatus } from "@/lib/request-status";

const ESTADOS: RequestStatus[] = ["novo", "contactado", "fechado", "perdido"];
const DEBOUNCE_MS = 800;

export function RequestControls({
  tipo,
  code,
  status,
  internalNotes,
}: {
  tipo: "pedido" | "orcamento";
  code: string;
  status: RequestStatus;
  internalNotes: string | null;
}) {
  const [estado, setEstado] = useState<RequestStatus>(status);
  const [notas, setNotas] = useState(internalNotes ?? "");
  const [guardado, setGuardado] = useState<"parado" | "a guardar" | "guardado">("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const primeiraRenderizacao = useRef(true);
  const router = useRouter();
  const id = useId();

  function mudarEstado(novo: RequestStatus) {
    setEstado(novo);
    setErro(null);
    iniciar(async () => {
      const r = await updateRequest({ tipo, code, status: novo });
      if (!r.ok) {
        setErro(r.error);
        setEstado(status);
        return;
      }
      router.refresh();
    });
  }

  // Gravação automática das notas, com debounce.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    setGuardado("a guardar");
    const timer = window.setTimeout(async () => {
      const r = await updateRequest({ tipo, code, internalNotes: notas.trim() || null });
      if (!r.ok) {
        setErro(r.error);
        setGuardado("parado");
        return;
      }
      setGuardado("guardado");
      window.setTimeout(() => setGuardado("parado"), 2000);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [notas, tipo, code]);

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="pb-3 font-accent text-[11px] tracking-caps text-subtle uppercase">
          Estado
        </legend>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((valor) => (
            <label
              key={valor}
              className={`cursor-pointer rounded-sm border px-4 py-2 font-accent text-eyebrow tracking-caps uppercase transition-colors has-focus-visible:shadow-(--focus-ring) ${
                valor === estado
                  ? "border-frame bg-brand/12 text-amber-500"
                  : "border-border text-body hover:border-copper-600"
              }`}
            >
              <input
                type="radio"
                name={`estado-${id}`}
                value={valor}
                checked={valor === estado}
                onChange={() => mudarEstado(valor)}
                className="sr-only"
              />
              {STATUS_LABEL[valor]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`${id}-notas`}>Notas internas</Label>
          <span aria-live="polite" className="text-small text-subtle">
            {guardado === "a guardar" ? "A guardar…" : guardado === "guardado" ? "Guardado" : ""}
          </span>
        </div>
        <Textarea
          id={`${id}-notas`}
          rows={6}
          value={notas}
          maxLength={4000}
          placeholder="O que ficou combinado, prazos, o que falta."
          onChange={(e) => setNotas(e.target.value)}
        />
        <p className="text-small text-subtle">Grava sozinho. O cliente nunca vê isto.</p>
      </div>

      {erro ? (
        <p role="alert" className="text-small text-danger">
          {erro}
        </p>
      ) : null}

      <Badge variant="ghost" className="self-start">
        Código {code}
      </Badge>
    </div>
  );
}
