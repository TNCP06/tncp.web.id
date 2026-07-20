import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/payload";
import { SiteFooter } from "../components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tech Stack",
  description: "The tools, languages, and platforms I build with.",
};

// ponytail: static content, no collection. Edit here when the stack changes.
type Tool = { name: string; tag: string; note: string };
type Group = { label: string; caption: string; items: Tool[] };

const GROUPS: Group[] = [
  {
    label: "Frontend",
    caption: "The interface layer users actually touch.",
    items: [
      { name: "Next.js", tag: "Framework", note: "App Router and server components for fast, well-structured interfaces." },
      { name: "React", tag: "Library", note: "The foundation of my component work — modular and predictable." },
      { name: "TypeScript", tag: "Language", note: "Type-safe code that catches mistakes before anything runs." },
    ],
  },
  {
    label: "Backend",
    caption: "The core logic and data behind every feature.",
    items: [
      { name: "Node.js", tag: "Runtime", note: "Scalable server-side logic connecting the interface to the data." },
      { name: "Payload CMS", tag: "CMS", note: "A code-first content backend with a fully typed data layer." },
      { name: "SQLite", tag: "Database", note: "A reliable embedded database — simple, fast, and durable." },
    ],
  },
  {
    label: "Infrastructure",
    caption: "How the work ships and stays online.",
    items: [
      { name: "Docker", tag: "Container", note: "Packaging apps into portable, reproducible environments." },
      { name: "AWS", tag: "Cloud", note: "Self-hosted compute tuned for tight resources and reliability." },
      { name: "Cloudflare", tag: "CDN", note: "Tunnels and edge delivery — fast reach without exposing the origin." },
    ],
  },
];

export default async function StackPage() {
  const profile = await getProfile();
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  return (
    <>
      <main className="bands">
        <header className="hero">
          <div className="wrap">
            <p className="mono" style={{ marginBottom: "1.5rem" }}>
              Tech Stack
            </p>
            <h1 className="name" style={{ maxWidth: "18ch" }}>
              The tools I build with.
            </h1>
            <p className="headline" style={{ maxWidth: "60ch" }}>
              A clear look at the languages, frameworks, and platforms behind my
              work — grouped by where they sit in the stack, from the interface
              down to the infrastructure.
            </p>
          </div>
        </header>

        {/* One band: stack list + FULLSTACK share a colour */}
        <div>
        <section className="section" aria-label="Tech stack" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            {GROUPS.map((group) => (
              <div className="instruments-group" key={group.label}>
                <div className="instruments-grid">
                  <div>
                    <p className="mono">{group.label}</p>
                    <p
                      style={{
                        color: "var(--ink-muted)",
                        fontSize: "0.92rem",
                        marginTop: "0.75rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {group.caption}
                    </p>
                  </div>
                  <div className="instruments-list">
                    {group.items.map((item) => (
                      <div className="instrument" key={item.name}>
                        <div className="instrument-name">
                          <h3>{item.name}</h3>
                          <span className="instrument-tag">{item.tag}</span>
                        </div>
                        <p>{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

          <section
            className="section"
            aria-hidden="true"
            style={{ paddingBlock: "clamp(3rem, 8vw, 6rem)" }}
          >
            <div className="wrap">
              <p
                className="mono"
                style={{ textAlign: "center", marginBottom: "1.5rem" }}
              >
                End to end
              </p>
              <p className="megaword">FULLSTACK</p>
            </div>
          </section>
        </div>

        <section className="section" aria-label="Work with me">
            <div className="wrap">
              <div className="cta-band">
                <p className="mono">Work with me</p>
                <h2>Have a project in mind?</h2>
                <Link className="btn btn-primary" href="/#contact">
                  Get in touch →
                </Link>
              </div>
            </div>
          </section>
      </main>

      <SiteFooter profile={profile} blogUrl={blogUrl} />
    </>
  );
}
