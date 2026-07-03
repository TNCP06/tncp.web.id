import { revalidatePath, revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";

// Revalidation only works inside a Next request/render context. When Payload
// mutates outside one (seed scripts, migrations, jobs), there is no cache store
// and revalidateTag throws — nothing to revalidate, so skip silently.
const safe = (fn: () => void): void => {
  try {
    fn();
  } catch {
    /* no Next cache store (CLI/script context) */
  }
};

const bustEntry = (slug?: string): void =>
  safe(() => {
    revalidateTag("portfolio-entries");
    if (slug) revalidateTag(`portfolio-entry:${slug}`);
    revalidatePath("/");
  });

export const revalidateEntryChange: CollectionAfterChangeHook = ({ doc }) => {
  bustEntry((doc as { slug?: string }).slug);
  return doc;
};

export const revalidateEntryDelete: CollectionAfterDeleteHook = ({ doc }) => {
  bustEntry((doc as { slug?: string }).slug);
  return doc;
};

export const revalidateProfile: GlobalAfterChangeHook = ({ doc }) => {
  safe(() => {
    revalidateTag("profile");
    revalidatePath("/");
  });
  return doc;
};
