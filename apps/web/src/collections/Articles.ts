import type { CollectionConfig } from "payload";
import {
  isAdmin,
  isAdminOrAgent,
  publishedOrLoggedIn,
  updateDraftsForAgent,
  forceAgentDraft,
} from "../access";
import { slugField } from "../fields/slug";
import { revalidateArticleChange, revalidateArticleDelete, setPublishedAt } from "../hooks/revalidate";

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
  hooks: {
    beforeChange: [forceAgentDraft, setPublishedAt],
    afterChange: [revalidateArticleChange],
    afterDelete: [revalidateArticleDelete],
  },
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
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "tech",
      // Mirrored by PAI's GENRE_CATEGORY (pipeline/stages.py) — change both sides.
      // Contract: ../Personal-Assistant-AI/INTEGRATION.md
      options: [
        { label: "Hiburan", value: "hiburan" },
        { label: "K-Pop", value: "kpop" },
        { label: "Film", value: "film" },
        { label: "Tech", value: "tech" },
        { label: "Tips", value: "tips" },
      ],
    },
    {
      name: "sources",
      type: "array",
      fields: [
        { name: "url", type: "text", required: true },
        { name: "label", type: "text" },
      ],
    },
    { name: "externalId", type: "text", unique: true, index: true, admin: { position: "sidebar", readOnly: true } },
    { name: "featured", type: "checkbox", defaultValue: false },
    { name: "featuredScore", type: "number", defaultValue: 0 },
    { name: "readingTime", type: "number", admin: { readOnly: true } },
    { name: "publishedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
  ],
};
