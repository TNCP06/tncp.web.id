import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getEntryBySlug, getPublishedEntries } from "@/lib/payload";
import { ENTRY_TYPE_LABEL, metaLabels, periodOf } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const entries = await getPublishedEntries();
  return entries.map((e) => ({ slug: e.slug ?? "" })).filter((p) => p.slug);
}

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
    <main className="wrap">
      <Link className="back" href="/">
        ← Back
      </Link>

      <div className="detail-head">
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
            <div className="meta-item">
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
      ) : null}

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
