import type { CollectionConfig } from "payload";
import { isAdmin } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true, // public assets
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    staticDir: process.env.MEDIA_DIR || "./data/media",
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [{ name: "alt", type: "text", localized: true }],
};
