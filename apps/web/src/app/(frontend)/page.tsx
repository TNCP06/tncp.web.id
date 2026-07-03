import type { Metadata } from "next";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { ProjectLedger } from "./components/ProjectLedger";
import { ContactForm } from "./components/ContactForm";

// Rendered on demand (DB is a runtime volume); data is cached via tags.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: profile.fullName || "Tionusa Catur Pamungkas",
    description: profile.headline || "Backend developer — systems, data, and cloud.",
  };
}

export default async function Home() {
  const [profile, entries] = await Promise.all([
    getProfile(),
    getPublishedEntries(),
  ]);

  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;
  const year = new Date().getFullYear();
  const cvUrl =
    typeof profile.cvFile === "object" && profile.cvFile ? profile.cvFile.url : null;

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-info">
              <p className="eyebrow">
                <span
                  className={`status-dot${profile.availableForWork ? " status-dot--ok" : ""}`}
                  aria-hidden="true"
                />
                <span className="mono">
                  {profile.headline ? "Backend Developer" : "Portfolio"}
                  {profile.availableForWork ? " · Available for work" : ""}
                </span>
              </p>
              <h1 className="name">{profile.fullName || "Tionusa Catur Pamungkas"}</h1>
              {profile.headline ? <p className="headline">{profile.headline}</p> : null}

              <div className="hero-meta">
                {profile.location ? <span className="mono">{profile.location}</span> : null}
                <span className="mono">ID · EN</span>
              </div>

              <div className="actions">
                <a className="btn btn-primary" href="#work">
                  View work
                </a>
                {cvUrl ? (
                  <a className="btn" href={cvUrl}>
                    Download CV
                  </a>
                ) : null}
                {blogUrl ? (
                  <a className="btn" href={blogUrl}>
                    Blog
                  </a>
                ) : null}
                <a className="btn" href="#contact">
                  Contact
                </a>
              </div>
            </div>

            <div className="hero-terminal" aria-hidden="true">
              <div className="terminal-header">
                <div className="terminal-buttons">
                  <span className="terminal-btn close" />
                  <span className="terminal-btn minimize" />
                  <span className="terminal-btn expand" />
                </div>
                <span className="terminal-title">guest@tncp: ~</span>
              </div>
              <div className="terminal-body">
                <div className="terminal-line"><span className="terminal-prompt">$</span> whoami</div>
                <div className="terminal-output">tionusa-catur-pamungkas</div>
                <div className="terminal-line"><span className="terminal-prompt">$</span> cat focus.json</div>
                <div className="terminal-output JSON">{"{"}</div>
                <div className="terminal-output JSON indent">"role": "Backend Developer",</div>
                <div className="terminal-output JSON indent">"stack": ["Node.js", "Docker", "AWS", "SQLite"],</div>
                <div className="terminal-output JSON indent">"available": {profile.availableForWork ? "true" : "false"}</div>
                <div className="terminal-output JSON">{"}"}</div>
                <div className="terminal-line"><span className="terminal-prompt">$</span> ping -c 1 tncp.web.id</div>
                <div className="terminal-output">64 bytes: icmp_seq=1 ttl=64 time=0.042 ms</div>
                <div className="terminal-line cursor-line"><span className="terminal-prompt">$</span> <span className="terminal-cursor" /></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {profile.bio ? (
        <section className="section section--alt" id="about" aria-label="About">
          <div className="wrap">
            <div className="panel">
              <div className="prose">
                <RichText data={profile.bio} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" id="work" aria-label="Featured Projects">
        <div className="wrap">
          <div className="section-head">
            <h2>Featured Projects</h2>
            <span className="mono">{entries.length} entries</span>
          </div>

          <ProjectLedger
            entries={entries}
            limit={6}
            showFilters={false}
            showAllLink={true}
          />
        </div>
      </section>

      <section className="section section--alt" id="contact" aria-label="Contact">
        <div className="wrap">
          <div className="section-head">
            <h2>Get in touch</h2>
            <span className="mono">Ready to collaborate</span>
          </div>
          <div className="contact-card">
            <div className="contact-info" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 className="contact-title" style={{ margin: 0 }}>Let's build something together</h3>
              <p className="contact-desc" style={{ margin: 0, maxWidth: "100%" }}>
                I'm always open to discussing backend architectures, systems engineering,
                database optimization, or cloud deployments. Drop me a line!
              </p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
                {profile.email ? (
                  <a className="contact-email-btn" href={`mailto:${profile.email}`} style={{ padding: "0.75rem 1.25rem", fontSize: "0.85rem", gap: "0.5rem" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {profile.email}
                  </a>
                ) : null}

                {(profile.socials ?? []).map((s, i) => {
                  const kind = (s as any).kind;
                  let icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  );

                  if (kind === "github") {
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    );
                  } else if (kind === "linkedin") {
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                    );
                  }

                  return (
                    <a key={i} href={s.url} className="btn" target="_blank" rel="noreferrer" style={{ padding: "0.75rem 1.25rem", fontSize: "0.85rem", gap: "0.5rem" }}>
                      {icon}
                      {s.label}
                    </a>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <p className="foot-meta">
            {profile.availableForWork ? "Available for work · " : ""}©{" "}
            {year} {profile.fullName || "Tionusa Catur Pamungkas"} · Built with
            Next.js + Payload
          </p>
        </div>
      </footer>
    </>
  );
}
