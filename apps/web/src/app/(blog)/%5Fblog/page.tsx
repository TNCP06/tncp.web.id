import type { Article } from "@/payload-types";
import { getFeaturedArticles, getArticles } from "@/lib/blog";
import { Hero } from "../components/Hero";
import { ArticleCard } from "../components/ArticleCard";

// Rendered on demand (DB is a runtime volume); data is cached via tags (see lib/blog.ts).
export const dynamic = "force-dynamic";

const TABS = [
  ["", "Semua"],
  ["hiburan", "Hiburan"],
  ["kpop", "K-Pop"],
  ["film", "Film"],
  ["tech", "Tech"],
  ["tips", "Tips"],
] as const;

export default async function BlogHome({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const [featured, list] = await Promise.all([
    getFeaturedArticles(),
    getArticles({ category: cat, limit: 12 }),
  ]);
  // Hero (Task 8) requires non-null slugs on its slides.
  const slides = featured.filter((a): a is Article & { slug: string } => Boolean(a.slug));

  return (
    <main className="k-wrap">
      {!cat && slides.length > 0 ? <Hero slides={slides} /> : null}
      <nav className="k-tabs">
        {TABS.map(([v, label]) => (
          <a
            key={v}
            href={v ? `/?cat=${v}` : "/"}
            className={`k-tab${(cat ?? "") === v ? " k-tab--active" : ""}`}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="k-grid">
        {list.docs.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      {list.docs.length === 0 ? <p className="k-empty">Belum ada artikel.</p> : null}
      {/* ponytail: page-1 only for launch, add cursor pagination when volume warrants */}
    </main>
  );
}
