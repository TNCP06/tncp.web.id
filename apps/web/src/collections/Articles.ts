import type { CollectionConfig } from "payload";
import {
  isAdmin,
  isAdminOrAgent,
  publishedOrLoggedIn,
  updateDraftsForAgent,
  forceAgentDraft,
} from "../access";
import { slugField } from "../fields/slug";

// Schema now; public UI is Phase 2.
export const Articles: CollectionConfig = {
  slug: "articles",
  admin: { useAsTitle: "title", defaultColumns: ["title", "source", "_status"] },
  versions: { drafts: true },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrAgent,
    update: updateDraftsForAgent,
    delete: isAdmin,
  },
  hooks: { beforeChange: [forceAgentDraft] },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    slugField("title"),
    { name: "excerpt", type: "textarea", localized: true },
    { name: "body", type: "richText", localized: true },
    { name: "coverImage", type: "upload", relationTo: "media" },
    { name: "tags", type: "text", hasMany: true },
    {
      name: "source",
      type: "select",
      defaultValue: "manual",
      options: [
        { label: "Manual", value: "manual" },
        { label: "AI", value: "ai" },
      ],
    },
  ],
};
