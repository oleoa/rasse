import type { MetadataRoute } from "next";
import { getPublishedProductSlugs } from "@/lib/queries/products";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "");
  const agora = new Date();

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: agora, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/produtos`, lastModified: agora, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/quem-somos`, lastModified: agora, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${base}/personalizado`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/legal/privacidade`,
      lastModified: agora,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    { url: `${base}/legal/termos`, lastModified: agora, changeFrequency: "yearly", priority: 0.2 },
  ];

  const slugs = await getPublishedProductSlugs();

  return [
    ...estaticas,
    ...slugs.map((slug) => ({
      url: `${base}/produtos/${slug}`,
      lastModified: agora,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
