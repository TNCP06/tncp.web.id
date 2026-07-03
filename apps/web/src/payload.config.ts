import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { PortfolioEntries } from "./collections/PortfolioEntries";
import { Articles } from "./collections/Articles";
import { Profile } from "./globals/Profile";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  editor: lexicalEditor(),
  collections: [Users, Media, PortfolioEntries, Articles],
  globals: [Profile],
  localization: {
    locales: [
      { label: "Bahasa Indonesia", code: "id" },
      { label: "English", code: "en" },
    ],
    defaultLocale: "id",
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || "",
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || "file:./data/tncp.db" },
    // ponytail: auto-sync schema on boot (dev + prod). Fine for a single
    // instance; switch to `payload migrate` if schema churn gets risky.
    push: true,
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
