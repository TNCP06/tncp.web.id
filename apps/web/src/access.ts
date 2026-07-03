import type { Access, CollectionBeforeChangeHook } from "payload";

type Role = "admin" | "agent";

const roleOf = (user: unknown): Role | undefined =>
  (user as { role?: Role } | null)?.role;

export const isAdmin: Access = ({ req }) => roleOf(req.user) === "admin";

export const isAdminOrAgent: Access = ({ req }) => {
  const role = roleOf(req.user);
  return role === "admin" || role === "agent";
};

/** Public reads only published docs; any logged-in user reads everything. */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};

/** Admin edits anything; agent edits only drafts; nobody else. */
export const updateDraftsForAgent: Access = ({ req }) => {
  const role = roleOf(req.user);
  if (role === "admin") return true;
  if (role === "agent") return { _status: { equals: "draft" } };
  return false;
};

/**
 * Agents can never publish — force draft on every write.
 * Phase 3: also force source=ai and reject edits to source=manual docs.
 */
export const forceAgentDraft: CollectionBeforeChangeHook = ({ req, data }) => {
  if (roleOf(req.user) === "agent") {
    (data as Record<string, unknown>)._status = "draft";
  }
  return data;
};
