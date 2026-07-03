import { getPayload } from "payload";
import config from "@payload-config";
import { unstable_cache } from "next/cache";
import type { PortfolioEntry, Profile } from "../payload-types";

const payloadPromise = getPayload({ config });

export const getProfile = unstable_cache(
  async (): Promise<Profile> => {
    const payload = await payloadPromise;
    return payload.findGlobal({ slug: "profile" });
  },
  ["profile"],
  { tags: ["profile"] },
);

/** Published entries, ordered: featured → priorityScore → startDate (all desc). */
export const getPublishedEntries = unstable_cache(
  async (): Promise<PortfolioEntry[]> => {
    const payload = await payloadPromise;
    const { docs } = await payload.find({
      collection: "portfolio-entries",
      where: { _status: { equals: "published" } },
      sort: ["-featured", "-priorityScore", "-startDate"],
      depth: 1,
      limit: 100,
    });
    return docs;
  },
  ["portfolio-list"],
  { tags: ["portfolio-entries"] },
);

export async function getEntryBySlug(slug: string): Promise<PortfolioEntry | null> {
  return unstable_cache(
    async () => {
      const payload = await payloadPromise;
      const { docs } = await payload.find({
        collection: "portfolio-entries",
        where: { slug: { equals: slug }, _status: { equals: "published" } },
        depth: 2,
        limit: 1,
      });
      return docs[0] ?? null;
    },
    ["portfolio-entry", slug],
    { tags: ["portfolio-entries", `portfolio-entry:${slug}`] },
  )();
}
