import type { CollectionConfig } from "payload";
import { isAdmin } from "../access";
import { notifyVisitor } from "../lib/notify";

// One row per notified visit (middleware filters bots/owner, /api/visit dedups
// per IP per hour). Created only via the local API in /api/visit — REST create
// is closed so nobody can forge visits.
export const VisitorLogs: CollectionConfig = {
  slug: "visitor-logs",
  admin: {
    useAsTitle: "path",
    defaultColumns: ["path", "host", "country", "referer", "createdAt"],
  },
  access: {
    create: () => false,
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      ({ operation, doc, req }) => {
        if (operation === "create") {
          notifyVisitor(req.payload, doc as Parameters<typeof notifyVisitor>[1]);
        }
      },
    ],
  },
  fields: [
    { name: "path", type: "text", required: true },
    { name: "host", type: "select", options: ["site", "blog"], defaultValue: "site" },
    { name: "country", type: "text" },
    { name: "ip", type: "text" },
    { name: "userAgent", type: "text" },
    { name: "referer", type: "text" },
  ],
};
