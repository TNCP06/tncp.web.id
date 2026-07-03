import type { MetadataRoute } from "next";
import { getPublishedEntries } from "@/lib/payload";

const base = process.env.SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublishedEntries();
  return [
    { url: base, lastModified: new Date() },
    ...entries
      .filter((e) => e.slug)
      .map((e) => ({
        url: `${base}/portfolio/${e.slug}`,
        lastModified: e.updatedAt ? new Date(e.updatedAt) : new Date(),
      })),
  ];
}
