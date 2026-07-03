import type { CollectionConfig } from "payload";
import { isAdmin } from "../access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    useAPIKey: true, // API key for the Phase 3 agent user (created manually later)
  },
  admin: { useAsTitle: "email", defaultColumns: ["email", "role"] },
  access: {
    // First-user creation bypasses access, so the initial admin can still be made.
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "admin",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Agent", value: "agent" },
      ],
    },
  ],
};
