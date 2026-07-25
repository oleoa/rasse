"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MarkdownEditor } from "@/components/dashboard/markdown-editor";
import { CopperRule } from "@/components/public/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings } from "@/lib/mutations/settings";
import { settingsSchema } from "@/lib/validation/product";

export type SettingsDraft = {
  businessName: string;
  whatsappNumber: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutMd: string;
  instagramUrl: string;
  contactEmail: string;
  cnpj: string;
};

function Campo({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-small text-subtle">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsForm({ inicial }: { inicial: SettingsDraft }) {
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  const id = useId();

  const alterar = (mudanca: Partial<SettingsDraft>) => {
    setValores((v) => ({ ...v, ...mudanca }));
    setSalvo(false);
  };

  function submeter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErros({});
    setErroGeral(null);

    const parsed = settingsSchema.safeParse(valores);
    if (!parsed.success) {
      const mapa: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path.filter((p) => typeof p === "string").join(".");
        if (campo && !mapa[campo]) mapa[campo] = issue.message;
      }
      setErros(mapa);
      setErroGeral("Corrija os campos marcados.");
      return;
    }

    iniciar(async () => {
      const r = await saveSettings(valores);
      if (!r.ok) {
        if (r.field) setErros({ [r.field]: r.error });
        setErroGeral(r.error);
        return;
      }
      setSalvo(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submeter} className="flex max-w-3xl flex-col gap-10">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Contato</h2>
        </div>

        <Campo label="Nome do negócio" htmlFor={`${id}-nome`} error={erros.businessName}>
          <Input
            id={`${id}-nome`}
            value={valores.businessName}
            maxLength={80}
            aria-invalid={!!erros.businessName}
            onChange={(e) => alterar({ businessName: e.target.value })}
          />
        </Campo>

        <Campo
          label="WhatsApp"
          htmlFor={`${id}-whatsapp`}
          error={erros.whatsappNumber}
          hint="Formato internacional, só dígitos. Ex: 5511987654321. É para cá que vão todos os pedidos."
        >
          <Input
            id={`${id}-whatsapp`}
            value={valores.whatsappNumber}
            inputMode="numeric"
            maxLength={20}
            aria-invalid={!!erros.whatsappNumber}
            onChange={(e) => alterar({ whatsappNumber: e.target.value.replace(/\D/g, "") })}
          />
        </Campo>

        <Campo label="Instagram" htmlFor={`${id}-instagram`} error={erros.instagramUrl}>
          <Input
            id={`${id}-instagram`}
            value={valores.instagramUrl}
            placeholder="https://www.instagram.com/oficinarasse/"
            aria-invalid={!!erros.instagramUrl}
            onChange={(e) => alterar({ instagramUrl: e.target.value })}
          />
        </Campo>

        <Campo label="E-mail de contato" htmlFor={`${id}-email`} error={erros.contactEmail}>
          <Input
            id={`${id}-email`}
            type="email"
            value={valores.contactEmail}
            aria-invalid={!!erros.contactEmail}
            onChange={(e) => alterar({ contactEmail: e.target.value })}
          />
        </Campo>

        <Campo
          label="CNPJ"
          htmlFor={`${id}-cnpj`}
          error={erros.cnpj}
          hint="Enquanto estiver vazio, as páginas legais mostram o marcador {{CNPJ}}."
        >
          <Input
            id={`${id}-cnpj`}
            value={valores.cnpj}
            maxLength={20}
            onChange={(e) => alterar({ cnpj: e.target.value })}
          />
        </Campo>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Home</h2>
        </div>

        <Campo
          label="Título do hero"
          htmlFor={`${id}-herotitle`}
          error={erros.heroTitle}
          hint="A última palavra fica em cobre automaticamente."
        >
          <Input
            id={`${id}-herotitle`}
            value={valores.heroTitle}
            maxLength={120}
            aria-invalid={!!erros.heroTitle}
            onChange={(e) => alterar({ heroTitle: e.target.value })}
          />
        </Campo>

        <Campo label="Subtítulo do hero" htmlFor={`${id}-herosub`} error={erros.heroSubtitle}>
          <Input
            id={`${id}-herosub`}
            value={valores.heroSubtitle}
            maxLength={200}
            aria-invalid={!!erros.heroSubtitle}
            onChange={(e) => alterar({ heroSubtitle: e.target.value })}
          />
        </Campo>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <CopperRule />
          <h2 className="font-display text-h3 font-bold text-display">Quem somos</h2>
        </div>

        <Campo label="Texto da oficina" htmlFor={`${id}-about`} error={erros.aboutMd}>
          <MarkdownEditor
            id={`${id}-about`}
            value={valores.aboutMd}
            invalid={!!erros.aboutMd}
            onChange={(v) => alterar({ aboutMd: v })}
          />
        </Campo>
      </section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background py-4">
        <Button type="submit" size="lg" carregando={pendente}>
          {pendente ? "Salvando…" : "Salvar"}
        </Button>
        {salvo ? (
          <Badge variant="success" aria-live="polite">
            Salvo
          </Badge>
        ) : null}
        {erroGeral ? (
          <p role="alert" className="w-full text-small text-danger">
            {erroGeral}
          </p>
        ) : null}
      </div>
    </form>
  );
}
