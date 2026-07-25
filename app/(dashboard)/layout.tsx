import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s — Painel Rassë" },
  robots: { index: false, follow: false },
};

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
