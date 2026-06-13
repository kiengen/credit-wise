import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";
import { allCardSlugs, cardUrl } from "./lib/cards";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...allCardSlugs().map((slug) => ({
      url: `${SITE_URL}${cardUrl(slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
