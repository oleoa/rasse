import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";
import { PageTracker } from "@/components/public/page-tracker";
import { getSettings } from "@/lib/queries/settings";

export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageTracker />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer
        businessName={settings?.businessName}
        instagramUrl={settings?.instagramUrl}
        contactEmail={settings?.contactEmail}
      />
    </div>
  );
}
