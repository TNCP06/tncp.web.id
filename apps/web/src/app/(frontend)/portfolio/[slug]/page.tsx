import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getEntryBySlug } from "@/lib/payload";
import { ENTRY_TYPE_LABEL, metaLabels, periodOf } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

// Rendered on demand (DB is a runtime volume); data is cached via tags.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: entry.title,
    description: entry.summary || undefined,
  };
}

const mediaUrl = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "url" in v
    ? ((v as { url?: string }).url ?? null)
    : null;

export default async function PortfolioDetail({ params }: Params) {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);
  if (!entry) notFound();

  const labels = metaLabels(entry.entryType);
  const period = periodOf(entry);
  const stack = (entry.techStack ?? []).filter(Boolean) as string[];
  const cover = mediaUrl(entry.coverImage);

  return (
    <main className="wrap" style={{ paddingBottom: "4rem" }}>
      <Link className="back" href="/">
        ← Back
      </Link>

      <div className="detail-head panel">
        <span className="mono">{ENTRY_TYPE_LABEL[entry.entryType] ?? "Entry"}</span>
        <h1 className="detail-title">{entry.title}</h1>

        <dl className="meta-grid">
          {entry.role ? (
            <div className="meta-item">
              <dt>{labels.role}</dt>
              <dd>{entry.role}</dd>
            </div>
          ) : null}
          {entry.organization ? (
            <div className="meta-item">
              <dt>{labels.org}</dt>
              <dd>{entry.organization}</dd>
            </div>
          ) : null}
          {period ? (
            <div className="meta-item">
              <dt>Period</dt>
              <dd>{period}</dd>
            </div>
          ) : null}
          {stack.length > 0 ? (
            <div className="meta-item meta-item--wide">
              <dt>{labels.stack}</dt>
              <dd>{stack.join(" · ")}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {cover ? (
        <img
          className="cover"
          src={cover}
          alt={entry.title}
          loading="lazy"
        />
      ) : (
        <div className="cover entry-thumbnail-fallback" style={{ aspectRatio: "21 / 9", minHeight: "10rem", borderRadius: "8px", border: "2px solid var(--line)", overflow: "hidden" }}>
          <svg className="entry-thumbnail-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "3.5rem", height: "3.5rem" }}>
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="var(--slate)" strokeOpacity="0.4"/>
            <path d="M6 8L10 11L6 14" stroke="var(--blue)" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 13H16" stroke="var(--blue)" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      {entry.body ? (
        <div className="prose" style={{ marginTop: "2.5rem" }}>
          <RichText data={entry.body} />
        </div>
      ) : null}

      {Array.isArray(entry.gallery) && entry.gallery.length > 0 ? (
        <div className="gallery">
          {entry.gallery.map((g, i) => {
            const url = mediaUrl(g);
            return url ? <img key={i} src={url} alt="" loading="lazy" /> : null;
          })}
        </div>
      ) : null}

      {entry.links && entry.links.length > 0 ? (
        <p className="entry-links" style={{ marginTop: "2rem" }}>
          {entry.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer">
              {l.label} ↗
            </a>
          ))}
        </p>
      ) : null}
    </main>
  );
}
