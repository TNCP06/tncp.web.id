import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/blog";

// `||` not `??`: .env sets NEXT_PUBLIC_BLOG_URL="" (empty, not unset) until filled in.
const base = process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tncp.web.id";

// Queried at request time (DB is a runtime volume).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { docs } = await getArticles({ limit: 1000 });
  return [
    { url: base, lastModified: new Date() },
    ...docs
      .filter((a) => a.slug)
      .map((a) => ({
        url: `${base}/${a.slug}`,
        lastModified: new Date(a.updatedAt || a.publishedAt || Date.now()),
      })),
  ];
}
