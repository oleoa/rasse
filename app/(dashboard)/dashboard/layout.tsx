import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth, signOut } from "@/lib/auth";
import { LOGIN_PATH } from "@/lib/auth.config";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // O middleware já protege /dashboard/*; isto é a segunda tranca, para o caso
  // de o matcher mudar sem alguém reparar.
  if (!session?.user) redirect(LOGIN_PATH);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: LOGIN_PATH });
  }

  return (
    <DashboardShell user={session.user} onSignOut={handleSignOut}>
      {children}
    </DashboardShell>
  );
}
