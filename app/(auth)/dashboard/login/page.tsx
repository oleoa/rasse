import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/public/container";
import { CopperRule, Eyebrow } from "@/components/public/typography";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destino =
    callbackUrl?.startsWith("/dashboard") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard";

  // Já autenticado: não faz sentido mostrar o formulário.
  const session = await auth();
  if (session?.user) redirect(destino);

  return (
    <div className="flex min-h-dvh flex-col justify-center py-16">
      <Container className="max-w-md">
        <div className="flex flex-col gap-6 rounded-md border border-border p-8">
          <div className="flex flex-col gap-3">
            <CopperRule />
            <Eyebrow>Painel</Eyebrow>
            <h1 className="font-display text-h2 font-bold text-display">Oficina Rassë</h1>
          </div>

          <LoginForm callbackUrl={destino} />
        </div>

        <p className="pt-6 text-center text-small text-subtle">
          <Link href="/">Voltar ao site</Link>
        </p>
      </Container>
    </div>
  );
}
