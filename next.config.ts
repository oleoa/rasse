import type { NextConfig } from "next";

/**
 * O domínio público do R2 só existe a partir da Fase 5. Enquanto NEXT_PUBLIC_R2_PUBLIC_URL
 * não estiver definida não há padrão remoto nenhum — as imagens de seed são
 * locais, servidas de `public/seed/`.
 */
function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!raw) return [];

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`NEXT_PUBLIC_R2_PUBLIC_URL não é uma URL válido: ${raw}`);
  }

  return [
    {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      pathname: "/**",
    },
  ];
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: remotePatterns(),
  },
};

export default nextConfig;
