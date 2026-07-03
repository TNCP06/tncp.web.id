import type { Metadata } from "next";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { ProjectLedger } from "../components/ProjectLedger";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: `Portfolio · ${profile.fullName || "Tionusa Catur Pamungkas"}`,
    description: "Full archive of systems, backend, and database engineering entries.",
  };
}

export default async function PortfolioPage() {
  const [profile, entries] = await Promise.all([
    getProfile(),
    getPublishedEntries(),
  ]);

  return (
    <main className="wrap" style={{ paddingBlock: "2.5rem 3.5rem" }}>
      <header
        style={{
          marginBottom: "1.75rem",
          borderBottom: "2px solid var(--line)",
          paddingBottom: "0.25rem",
        }}
      >
        <h1 className="name" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          Projects Archive
        </h1>
        <p className="mono" style={{ marginTop: "0.4rem", color: "var(--ink-muted)" }}>
          Explore all backend systems, cloud infrastructure, and database engineering entries.
        </p>
      </header>

      <ProjectLedger entries={entries} showFilters={true} showAllLink={false} />
    </main>
  );
}
