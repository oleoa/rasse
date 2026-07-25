import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oficina Rassë",
    short_name: "Rassë",
    description: "Oficina-ateliê de gravação em madeira e impressão 3D.",
    start_url: "/",
    display: "standalone",
    background_color: "#15100b",
    theme_color: "#15100b",
    lang: "pt-BR",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
