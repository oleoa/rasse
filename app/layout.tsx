import type { Metadata } from "next";
import { Lora, Oswald, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Times New Roman", "serif"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Oficina Rassë",
    template: "%s — Oficina Rassë",
  },
  description: "Oficina-ateliê de gravação em madeira e impressão 3D.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${playfair.variable} ${oswald.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
