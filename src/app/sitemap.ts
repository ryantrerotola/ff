import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let patternEntries: MetadataRoute.Sitemap = [];
  try {
    const patterns = await prisma.flyPattern.findMany({
      select: { slug: true, updatedAt: true },
    });
    patternEntries = patterns.map((pattern) => ({
      url: `${APP_URL}/patterns/${pattern.slug}`,
      lastModified: pattern.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Database unavailable at build time — return static pages only
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/forum`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/hatch`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  return [...staticPages, ...patternEntries];
}
