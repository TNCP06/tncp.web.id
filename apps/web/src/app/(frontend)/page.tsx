import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { ENTRY_TYPE_LABEL } from "@/lib/format";

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
  const cvUrl =
    typeof profile.cvFile === "object" && profile.cvFile ? profile.cvFile.url : null;

  return (
    <>
      <header className="hero wrap">
        <p className="eyebrow">
          <span className="status-dot" aria-hidden="true" />
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
      </header>

      {profile.bio ? (
        <section className="section wrap" aria-label="About">
          <div className="prose">
            <RichText data={profile.bio} />
          </div>
        </section>
      ) : null}

      <section className="section wrap" id="work" aria-label="Selected work">
        <div className="section-head">
          <h2>Selected work</h2>
          <span className="mono">{entries.length} entries</span>
        </div>

        {entries.length === 0 ? (
          <p className="empty">No published entries yet.</p>
        ) : (
          <div className="ledger">
            {entries.map((e) => {
              const stack = (e.techStack ?? []).filter(Boolean) as string[];
              return (
                <article className="entry" key={e.id}>
                  <div className="entry-aside">
                    <span className="mono">
                      {ENTRY_TYPE_LABEL[e.entryType] ?? "Entry"}
                    </span>
                    {e.featured ? <span className="badge">Featured</span> : null}
                  </div>
                  <div>
                    <h3 className="entry-title">
                      <Link href={`/portfolio/${e.slug}`}>{e.title}</Link>
                    </h3>
                    {e.summary ? <p className="entry-summary">{e.summary}</p> : null}
                    {stack.length > 0 ? (
                      <p className="fingerprint">{stack.join("  ·  ")}</p>
                    ) : null}
                    {e.links && e.links.length > 0 ? (
                      <p className="entry-links">
                        {e.links.map((l, i) => (
                          <a key={i} href={l.url} target="_blank" rel="noreferrer">
                            {l.label} ↗
                          </a>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="site-footer wrap" id="contact">
        <span className="mono">Contact</span>
        <div className="socials">
          {profile.email ? (
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          ) : null}
          {(profile.socials ?? []).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer">
              {s.label} ↗
            </a>
          ))}
        </div>
      </footer>
    </>
  );
}
