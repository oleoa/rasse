import type { Metadata } from "next";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { CopperRule } from "@/components/public/typography";
import { getSettings } from "@/lib/queries/settings";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <CopperRule />
        <h1 className="font-display text-h2 font-bold text-display">Configurações.</h1>
      </div>

      <SettingsForm
        inicial={{
          businessName: settings?.businessName ?? "Oficina Rassë",
          whatsappNumber: settings?.whatsappNumber ?? "",
          heroTitle: settings?.heroTitle ?? "",
          heroSubtitle: settings?.heroSubtitle ?? "",
          aboutMd: settings?.aboutMd ?? "",
          instagramUrl: settings?.instagramUrl ?? "",
          contactEmail: settings?.contactEmail ?? "",
          cnpj: settings?.cnpj ?? "",
        }}
      />
    </div>
  );
}
