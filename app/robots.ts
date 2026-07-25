import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // A cesta e as pré-visualizações não têm nada que indexar; o painel e a
        // API são privados.
        disallow: ["/dashboard", "/api/", "/cesta", "/produtos/*/previsualizar"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
