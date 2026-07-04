import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getArticleBySlug, getRelated } from "@/lib/blog";
import { ArticleCard } from "../../components/ArticleCard";

type Params = { params: Promise<{ slug: string }> };

// Rendered on demand (DB is a runtime volume); data is cached via tags (see lib/blog.ts).
export const dynamic = "force-dynamic";

const mediaUrl = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "url" in v
    ? ((v as { url?: string }).url ?? null)
    : null;

const CAT: Record<string, string> = {
  hiburan: "HIBURAN",
  kpop: "K-POP",
  film: "FILM",
  tech: "TECH",
  tips: "TIPS",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Tak ditemukan" };

  const cover = mediaUrl(article.coverImage);

  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      type: "article",
      publishedTime: article.publishedAt || undefined,
      images: cover ? [cover] : [],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const cover = mediaUrl(article.coverImage);
  const related = await getRelated(article.category, slug);
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(cover ? { image: new URL(cover, process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tncp.web.id").toString() } : {}),
    datePublished: article.publishedAt || undefined,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: "KANAL" },
    publisher: { "@type": "Organization", name: "KANAL" },
  };

  return (
    <main className="k-wrap k-article">
      <a className="k-back" href="/">
        ← Semua
      </a>

      {cover ? (
        <img className="k-article__cover" src={cover} alt={article.title} />
      ) : null}

      <span className="k-chip">{CAT[article.category] ?? article.category}</span>
      <h1 className="k-article__title">{article.title}</h1>
      <p className="k-article__meta">{date}</p>

      {article.body ? (
        <div className="k-prose">
          <RichText data={article.body} />
        </div>
      ) : null}

      {Array.isArray(article.sources) && article.sources.length > 0 ? (
        <div className="k-sources">
          <h3>Sumber</h3>
          <ul>
            {article.sources.map((s, i) => (
              <li key={s.id ?? i}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label || s.url} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="k-related">
          <h3>Terkait</h3>
          <div className="k-grid">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} />
            ))}
          </div>
        </div>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </main>
  );
}
