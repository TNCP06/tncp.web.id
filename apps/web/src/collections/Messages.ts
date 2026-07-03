import type { CollectionConfig } from "payload";
import { isAdmin } from "../access";
import { notifyNewMessage } from "../lib/notify";

export const Messages: CollectionConfig = {
  slug: "messages",
  admin: { useAsTitle: "name", defaultColumns: ["name", "email", "readStatus", "createdAt"] },
  access: {
    create: () => true,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      ({ operation, doc, req }) => {
        // Notify the owner (email + Telegram) only on a fresh submission,
        // not on admin edits like toggling readStatus.
        if (operation === "create") {
          notifyNewMessage(req.payload, doc as { name: string; email: string; message: string });
        }
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true, maxLength: 100 },
    { name: "email", type: "email", required: true },
    { name: "message", type: "textarea", required: true, maxLength: 5000 },
    { name: "readStatus", type: "checkbox", defaultValue: false },
  ],
};
