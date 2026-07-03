import type { PortfolioEntry } from "../payload-types";

export const ENTRY_TYPE_LABEL: Record<string, string> = {
  project: "Project",
  work_experience: "Work",
  education: "Education",
  other: "Entry",
};

const year = (d?: string | null): string | null =>
  d ? String(new Date(d).getFullYear()) : null;

/** "2024 — Present" / "2023 — 2024" / "2025" / "Ongoing" / null. */
export function periodOf(
  e: Pick<PortfolioEntry, "startDate" | "endDate" | "isOngoing">,
): string | null {
  const start = year(e.startDate);
  if (!start) return e.isOngoing ? "Ongoing" : null;
  const end = e.isOngoing ? "Present" : year(e.endDate);
  return end ? `${start} — ${end}` : start;
}

/** Meta field labels adapt to the entry type. */
export function metaLabels(entryType: string): {
  role: string;
  org: string;
  stack: string;
} {
  switch (entryType) {
    case "work_experience":
      return { role: "Role", org: "Company", stack: "Stack" };
    case "education":
      return { role: "Program", org: "Institution", stack: "Focus" };
    default:
      return { role: "Role", org: "Organization", stack: "Stack" };
  }
}
