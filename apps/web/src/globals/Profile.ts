import type { GlobalConfig } from "payload";
import { isAdmin } from "../access";

export const Profile: GlobalConfig = {
  slug: "profile",
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    { name: "fullName", type: "text", required: true },
    { name: "headline", type: "text", localized: true },
    { name: "bio", type: "richText", localized: true },
    { name: "photo", type: "upload", relationTo: "media" },
    { name: "location", type: "text", localized: true },
    { name: "email", type: "email" },
    {
      name: "socials",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
        {
          name: "kind",
          type: "select",
          defaultValue: "other",
          options: [
            { label: "GitHub", value: "github" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "Other", value: "other" },
          ],
        },
      ],
    },
    { name: "cvFile", type: "upload", relationTo: "media" },
    { name: "availableForWork", type: "checkbox", defaultValue: true },
  ],
};
