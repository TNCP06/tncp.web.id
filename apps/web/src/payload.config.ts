import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { PortfolioEntries } from "./collections/PortfolioEntries";
import { Articles } from "./collections/Articles";
import { Messages } from "./collections/Messages";
import { Profile } from "./globals/Profile";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  editor: lexicalEditor(),
  // SMTP is optional: without SMTP_HOST, Payload falls back to a console mock
  // (fine for local dev). Telegram delivery is independent (see lib/notify.ts).
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromName: "tncp.web.id",
        defaultFromAddress:
          process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@tncp.web.id",
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  collections: [Users, Media, PortfolioEntries, Articles, Messages],
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
