import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth, signOut } from "@/lib/auth";
import { countNovos } from "@/lib/queries/requests";
import { LOGIN_PATH } from "@/lib/auth.config";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // O middleware já protege /dashboard/*; isto é a segunda tranca, para o caso
  // de o matcher mudar sem alguém reparar.
  if (!session?.user) redirect(LOGIN_PATH);

  const novos = await countNovos();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: LOGIN_PATH });
  }

  return (
    <DashboardShell
      user={session.user}
      novos={{
        "/dashboard/pedidos": novos.pedidos,
        "/dashboard/orcamentos": novos.orcamentos,
      }}
      onSignOut={handleSignOut}
    >
      {children}
    </DashboardShell>
  );
}
