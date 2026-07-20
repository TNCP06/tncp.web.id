import type { Metadata } from "next";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { ProjectLedger } from "../components/ProjectLedger";
import { SiteFooter } from "../components/SiteFooter";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: `Portfolio · ${profile.fullName || "Tionusa Catur Pamungkas"}`,
    description: "Full list of engineering work across backend, data, and cloud.",
  };
}

export default async function PortfolioPage() {
  const [profile, entries] = await Promise.all([
    getProfile(),
    getPublishedEntries(),
  ]);

  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  return (
    <>
      <div className="bands">
      <header className="hero" aria-label="Portfolio intro">
        <div className="wrap">
          <p className="mono" style={{ marginBottom: "1.5rem" }}>
            Portfolio · All Projects
          </p>
          <h1 className="name">Selected Work</h1>
          <p className="headline" style={{ maxWidth: "60ch" }}>
            Every system I&rsquo;ve designed and shipped — backend services, data
            pipelines, and cloud infrastructure. Filter by category, or open any
            entry for the full breakdown.
          </p>
        </div>
      </header>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Projects">
        <div className="wrap">
          <ProjectLedger entries={entries} showFilters={true} showAllLink={false} />
        </div>
      </section>
      </div>

      <SiteFooter profile={profile} blogUrl={blogUrl} />
    </>
  );
}
