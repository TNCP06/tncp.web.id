# Blog Phase 2 (KANAL) — tncp.web.id Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public KANAL blog on `blog.tncp.web.id` — content model, ingest API for the PAI bot, and the branded `(blog)` frontend with an AI-featured hero carousel.

**Architecture:** Blog lives in the existing `apps/web` (Next App Router + Payload CMS 3). A `middleware.ts` host-rewrite maps `blog.tncp.web.id/*` → a new `(blog)` route group with its own layout/tokens. Content is the existing `articles` collection (extended); PAI pushes drafts via two secret-guarded Next route handlers that use the Payload Local API (which bypasses access control), then a publish route flips draft→published and revalidates.

**Tech Stack:** Next.js App Router, TypeScript, Payload CMS 3 (`@payloadcms/db-sqlite`, `@payloadcms/richtext-lexical`), React Server Components + one client component (carousel).

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-07-03-blog-phase2-kanal-design.md` (source of truth).
- **DB/schema:** SQLite via `@payloadcms/db-sqlite`. **Never hand-edit prod DDL.** After any collection/field change: `pnpm --filter web payload migrate:create <name>`, commit the generated `src/migrations/*` (`.ts` + `.json` + updated `index.ts`).
- **Build:** never build on the VPS; CI builds. Local gate for every task: `pnpm --filter web typecheck` then `pnpm --filter web build` must pass. (Repo has **no unit-test framework** — CI runs typecheck + build only; seed script exists via `pnpm --filter web seed`. This plan uses typecheck/build + small runnable checks, not a new test runner.)
- **Commits:** Conventional Commits, imperative subject ≤72 chars, body bullets for multi-change. **No `Co-authored-by`, no Claude trailer.** Commit as the owner.
- **Blog is id-only, one accent `#6d5efc`, brand "KANAL.".** `source=ai` is admin-only, never rendered publicly.
- **Docs are part of done:** update `docs/codemap.md` (+ `data-model.md`, `architecture.md`) in the same change and refresh their `Last verified` line.
- `apps/web` is `"type": "module"`. Payload Local API reads/writes bypass access control (`overrideAccess` defaults true) — so ingest routes must set `_status` explicitly.

---

### Task 1: Extend the `articles` collection + revalidation + migration

**Files:**
- Modify: `apps/web/src/collections/Articles.ts`
- Modify: `apps/web/src/hooks/revalidate.ts` (add article hooks)
- Create: `apps/web/src/migrations/*` (generated)
- Modify: `docs/data-model.md`

**Interfaces:**
- Produces: `articles` collection with new fields `category` (`'hiburan'|'kpop'|'film'|'tech'|'tips'`), `sources` (array `{url,label}`), `externalId` (text unique), `featured` (checkbox), `featuredScore` (number), `readingTime` (number). Revalidation tags: `articles`, `article:<slug>`, `blog-featured`.

- [ ] **Step 1: Add fields to `Articles.ts`.** Append to the `fields` array (after `source`) and add the revalidation hook:

```ts
// in Articles.ts — extend imports
import { revalidateArticleChange, revalidateArticleDelete } from "../hooks/revalidate";

// add to config:
  hooks: {
    beforeChange: [forceAgentDraft],
    afterChange: [revalidateArticleChange],
    afterDelete: [revalidateArticleDelete],
  },

// add these fields after the existing `source` select:
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "tech",
      options: [
        { label: "Hiburan", value: "hiburan" },
        { label: "K-Pop", value: "kpop" },
        { label: "Film", value: "film" },
        { label: "Tech", value: "tech" },
        { label: "Tips", value: "tips" },
      ],
    },
    {
      name: "sources",
      type: "array",
      fields: [
        { name: "url", type: "text", required: true },
        { name: "label", type: "text" },
      ],
    },
    { name: "externalId", type: "text", unique: true, index: true, admin: { position: "sidebar", readOnly: true } },
    { name: "featured", type: "checkbox", defaultValue: false },
    { name: "featuredScore", type: "number", defaultValue: 0 },
    { name: "readingTime", type: "number", admin: { readOnly: true } },
```

- [ ] **Step 2: Add article revalidation hooks to `revalidate.ts`:**

```ts
const bustArticle = (slug?: string): void =>
  safe(() => {
    revalidateTag("articles");
    revalidateTag("blog-featured");
    if (slug) revalidateTag(`article:${slug}`);
  });

export const revalidateArticleChange: CollectionAfterChangeHook = ({ doc }) => {
  bustArticle((doc as { slug?: string }).slug);
  return doc;
};
export const revalidateArticleDelete: CollectionAfterDeleteHook = ({ doc }) => {
  bustArticle((doc as { slug?: string }).slug);
  return doc;
};
```

- [ ] **Step 3: Regenerate types + create migration:**

Run: `pnpm --filter web payload generate:types && pnpm --filter web payload migrate:create blog_phase2_articles`
Expected: new `src/migrations/<ts>_blog_phase2_articles.ts` + `.json`, `index.ts` updated, `payload-types.ts` shows the new `Article` fields.

- [ ] **Step 4: Verify build + schema apply locally.**

Run: `pnpm --filter web typecheck && pnpm --filter web build`
Expected: PASS. (Dev `push` syncs the local SQLite; the migration covers prod.)

- [ ] **Step 5: Update `docs/data-model.md`** — add the new `articles` fields to its table and bump the `Last verified` line.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/collections/Articles.ts apps/web/src/hooks/revalidate.ts apps/web/src/migrations apps/web/src/payload-types.ts docs/data-model.md
git commit -m "feat(blog): extend articles model (category, sources, featured, readingTime) + migration"
```

---

### Task 2: Ingest helpers — markdown→Lexical + reading time

**Files:**
- Create: `apps/web/src/lib/ingest.ts`
- Create: `apps/web/scripts/check-ingest.ts` (runnable check)

**Interfaces:**
- Produces: `markdownToLexical(markdown: string): Promise<SerializedEditorState>`, `readingTimeMinutes(markdown: string): number`, `INGEST` auth constants.

- [ ] **Step 1: Verify the converter export exists** (Payload version can shift the API):

Run: `node -e "const m=require('@payloadcms/richtext-lexical'); console.log(['convertMarkdownToLexical','editorConfigFactory'].map(k=>k+':'+(k in m)))"`
Expected: both `true`. If names differ, check `node_modules/@payloadcms/richtext-lexical/dist/index.js` exports and adjust the import in Step 2.

- [ ] **Step 2: Write `lib/ingest.ts`:**

```ts
import config from "@payload-config";
import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";

export async function markdownToLexical(markdown: string) {
  const editorConfig = await editorConfigFactory.default({ config: await config });
  return convertMarkdownToLexical({ editorConfig, markdown });
}

/** ~200 words/min, min 1. */
export function readingTimeMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
```

- [ ] **Step 3: Write the runnable check `scripts/check-ingest.ts`:**

```ts
import { markdownToLexical, readingTimeMinutes } from "../src/lib/ingest";

async function main() {
  const md = "# Judul\n\nParagraf **tebal** dengan [tautan](https://x.id).\n\n- satu\n- dua";
  const lex = await markdownToLexical(md);
  if (!lex || typeof lex !== "object" || !("root" in lex)) throw new Error("lexical output invalid");
  if (readingTimeMinutes("kata ".repeat(400)) !== 2) throw new Error("reading time wrong");
  console.log("check-ingest OK");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Add the script + run it.** In `apps/web/package.json` scripts add `"check-ingest": "tsx scripts/check-ingest.ts"` (mirror the existing `seed` script's runner).

Run: `pnpm --filter web check-ingest`
Expected: `check-ingest OK`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/ingest.ts apps/web/scripts/check-ingest.ts apps/web/package.json
git commit -m "feat(blog): ingest helpers (markdown->lexical, reading time) + runnable check"
```

---

### Task 3: Ingest create endpoint — `POST /api/ingest/article`

**Files:**
- Create: `apps/web/src/app/(payload)/api/ingest/article/route.ts`

**Interfaces:**
- Consumes: `markdownToLexical`, `readingTimeMinutes` (Task 2); `articles` fields (Task 1).
- Produces: `POST /api/ingest/article` — `Authorization: Bearer <INGEST_SECRET>`, `multipart/form-data` with `payload` (JSON) + optional `cover` (file). Returns `{ id, slug, status:"draft", adminUrl }`. Upserts by `externalId`.

- [ ] **Step 1: Write the route** (static route under `(payload)/api` shadows Payload's `/api/[...slug]`, same as the existing `health` route):

```ts
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { markdownToLexical, readingTimeMinutes } from "@/lib/ingest";

function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  const header = req.headers.get("authorization");
  return !!secret && header === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = JSON.parse(String(form.get("payload") ?? "")); }
  catch { return NextResponse.json({ error: "invalid payload json" }, { status: 400 }); }

  const { externalId, title, bodyMarkdown, excerpt, category, tags, sources, featured, featuredScore } = body as Record<string, any>;
  if (!externalId || !title || !bodyMarkdown || !category) {
    return NextResponse.json({ error: "externalId, title, bodyMarkdown, category required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  // optional cover → media
  let coverImage: string | undefined;
  const cover = form.get("cover");
  if (cover && typeof cover === "object" && "arrayBuffer" in cover) {
    const buf = Buffer.from(await (cover as File).arrayBuffer());
    const media = await payload.create({
      collection: "media",
      data: { alt: String(title).slice(0, 200) },
      file: { data: buf, mimetype: (cover as File).type || "image/png", name: (cover as File).name || `${externalId}.png`, size: buf.length },
    });
    coverImage = media.id as string;
  }

  const data: Record<string, unknown> = {
    title, excerpt: excerpt ?? "",
    body: await markdownToLexical(String(bodyMarkdown)),
    category, source: "ai",
    tags: Array.isArray(tags) ? tags : [],
    sources: Array.isArray(sources) ? sources : [],
    featured: !!featured, featuredScore: Number(featuredScore) || 0,
    readingTime: readingTimeMinutes(String(bodyMarkdown)),
    externalId, _status: "draft",
    ...(coverImage ? { coverImage } : {}),
  };

  const existing = await payload.find({ collection: "articles", where: { externalId: { equals: externalId } }, limit: 1, locale: "id" });
  const doc = existing.docs[0]
    ? await payload.update({ collection: "articles", id: existing.docs[0].id, data, locale: "id" })
    : await payload.create({ collection: "articles", data, locale: "id" });

  const adminUrl = `${process.env.SITE_URL ?? ""}/admin/collections/articles/${doc.id}`;
  return NextResponse.json({ id: doc.id, slug: doc.slug, status: "draft", adminUrl }, { status: 201 });
}
```

- [ ] **Step 2: Typecheck + build.**

Run: `pnpm --filter web typecheck && pnpm --filter web build`
Expected: PASS.

- [ ] **Step 3: Manual smoke (local dev).** Start `pnpm --filter web dev`, set `INGEST_SECRET=devsecret` in `apps/web/.env`, then:

Run:
```bash
printf '{"externalId":"t1","title":"Tes Artikel","bodyMarkdown":"# Halo\n\nIsi **tes**.","excerpt":"ringkas","category":"tech","tags":["ai"],"sources":[{"url":"https://x.id","label":"X"}],"featured":true,"featuredScore":80}' > /tmp/p.json
curl -s -X POST http://localhost:3000/api/ingest/article -H "Authorization: Bearer devsecret" -F payload=@/tmp/p.json;type=application/json
```
Expected: `{"id":...,"slug":"tes-artikel","status":"draft",...}`. Re-run → same id (upsert). Wrong/no bearer → 401. Confirm the draft appears in `/admin`.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(payload)/api/ingest/article/route.ts"
git commit -m "feat(blog): ingest create endpoint (draft upsert by externalId, cover->media)"
```

---

### Task 4: Ingest publish endpoint — `POST /api/ingest/article/[id]/publish`

**Files:**
- Create: `apps/web/src/app/(payload)/api/ingest/article/[id]/publish/route.ts`

**Interfaces:**
- Consumes: same `INGEST_SECRET` auth as Task 3.
- Produces: `POST /api/ingest/article/[id]/publish` → sets `_status=published`, returns `{ id, slug, url }`. Idempotent.

- [ ] **Step 1: Write the route:**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const payload = await getPayload({ config });
  const doc = await payload.update({ collection: "articles", id, data: { _status: "published" }, locale: "id" })
    .catch(() => null);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const base = process.env.NEXT_PUBLIC_BLOG_URL ?? process.env.SITE_URL ?? "";
  return NextResponse.json({ id: doc.id, slug: doc.slug, url: `${base}/${doc.slug}` }, { status: 200 });
}
```

- [ ] **Step 2: Typecheck + build.** Run: `pnpm --filter web typecheck && pnpm --filter web build` — Expected PASS.

- [ ] **Step 3: Manual smoke.** Using the id from Task 3 Step 3:

Run: `curl -s -X POST http://localhost:3000/api/ingest/article/<id>/publish -H "Authorization: Bearer devsecret"`
Expected: `{"id":...,"slug":"tes-artikel","url":".../tes-artikel"}`; the doc is now `published` in `/admin`. Re-run → still 200 (idempotent). Unknown id → 404.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(payload)/api/ingest/article/[id]/publish/route.ts"
git commit -m "feat(blog): ingest publish endpoint (draft->published, idempotent)"
```

---

### Task 5: Blog data layer

**Files:**
- Create: `apps/web/src/lib/blog.ts`

**Interfaces:**
- Produces: `getFeaturedArticles(): Promise<Article[]>` (tag `blog-featured`, ≤5), `getArticles(opts?:{category?:string,limit?:number,page?:number}): Promise<{docs:Article[],hasMore:boolean}>` (tag `articles`), `getArticleBySlug(slug): Promise<Article|null>` (tags `articles`,`article:<slug>`), `getRelated(category,excludeSlug): Promise<Article[]>`. All published-only, `locale:"id"`.

- [ ] **Step 1: Write `lib/blog.ts`** (mirror `lib/payload.ts` patterns exactly):

```ts
import { getPayload } from "payload";
import config from "@payload-config";
import { unstable_cache } from "next/cache";
import type { Article } from "../payload-types";

const payloadPromise = getPayload({ config });
const PUBLISHED = { _status: { equals: "published" } };

export const getFeaturedArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const payload = await payloadPromise;
    const { docs } = await payload.find({
      collection: "articles", locale: "id", depth: 1, limit: 5,
      where: { and: [PUBLISHED, { featured: { equals: true } }] },
      sort: ["-featuredScore", "-publishedAt"],
    });
    if (docs.length) return docs;
    const latest = await payload.find({ collection: "articles", locale: "id", depth: 1, limit: 5, where: PUBLISHED, sort: "-publishedAt" });
    return latest.docs;
  },
  ["blog-featured"], { tags: ["blog-featured"] },
);

export async function getArticles(opts: { category?: string; limit?: number; page?: number } = {}) {
  const { category, limit = 12, page = 1 } = opts;
  return unstable_cache(
    async () => {
      const payload = await payloadPromise;
      const where = category ? { and: [PUBLISHED, { category: { equals: category } }] } : PUBLISHED;
      const res = await payload.find({ collection: "articles", locale: "id", depth: 1, limit, page, where, sort: "-publishedAt" });
      return { docs: res.docs as Article[], hasMore: res.hasNextPage ?? false };
    },
    ["blog-list", category ?? "all", String(page), String(limit)], { tags: ["articles"] },
  )();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return unstable_cache(
    async () => {
      const payload = await payloadPromise;
      const { docs } = await payload.find({ collection: "articles", locale: "id", depth: 2, limit: 1, where: { and: [PUBLISHED, { slug: { equals: slug } }] } });
      return (docs[0] as Article) ?? null;
    },
    ["blog-article", slug], { tags: ["articles", `article:${slug}`] },
  )();
}

export async function getRelated(category: string, excludeSlug: string): Promise<Article[]> {
  const payload = await payloadPromise;
  const { docs } = await payload.find({
    collection: "articles", locale: "id", depth: 1, limit: 3,
    where: { and: [PUBLISHED, { category: { equals: category } }, { slug: { not_equals: excludeSlug } }] },
    sort: "-publishedAt",
  });
  return docs as Article[];
}
```

- [ ] **Step 2: Typecheck.** Run: `pnpm --filter web typecheck` — Expected PASS (confirms `Article` type + query shapes).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/blog.ts
git commit -m "feat(blog): data layer (featured, list, by-slug, related) with cache tags"
```

---

### Task 6: `(blog)` route group — layout, tokens, fonts, theme toggle, host middleware

**Files:**
- Create: `apps/web/src/app/(blog)/layout.tsx`
- Create: `apps/web/src/app/(blog)/blog.css`
- Create: `apps/web/src/app/(blog)/components/BlogNav.tsx`, `.../ThemeToggle.tsx`
- Create: `apps/web/src/middleware.ts`

**Interfaces:**
- Produces: a KANAL-branded root layout for the `(blog)` group; host `blog.tncp.web.id` rewrites to `/(blog)`. CSS classes: `.k-wrap`, `.k-nav`, `.k-card`, `.k-chip`, `.k-hero`, `.k-dots` (violet `--k-accent:#6d5efc`, light+dark).

- [ ] **Step 1: `middleware.ts`** — host rewrite (root of `apps/web/src`):

```ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isBlog = host.startsWith("blog.");
  const { pathname } = req.nextUrl;
  if (isBlog && !pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/_blog")) {
    const url = req.nextUrl.clone();
    url.pathname = `/_blog${pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

Note: the `(blog)` group's URL segment is `_blog` (see Step 2 folder name) so the rewrite target is explicit and cannot collide with portfolio routes. Pages live at `app/(blog)/_blog/…` OR use a route-group + `basePath`-free rewrite — **implement as `app/_blog/…` folder** to keep the rewrite trivial; wrap it in a `(blog)` route group only if a separate root layout is needed (it is — Payload allows multiple root layouts per group). Final structure: `app/(blog)/_blog/layout.tsx` + pages. Verify the rewrite resolves in Step 5.

- [ ] **Step 2: `(blog)/_blog/layout.tsx`** (own root layout — separate from `(frontend)`):

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { BlogNav } from "../components/BlogNav";
import "../blog.css";

const themeScript = `(function(){try{var t=localStorage.getItem('kanal-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.ktheme=t;}catch(e){}})();`;
const display = Space_Grotesk({ subsets: ["latin"], variable: "--k-display", weight: ["500","600","700"], display: "swap" });
const bodyF = Inter({ subsets: ["latin"], variable: "--k-body", weight: ["400","500","600","700"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--k-mono", weight: ["400","600","700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tncp.web.id"),
  title: { default: "KANAL", template: "%s · KANAL" },
  description: "Hiburan, tech, dan tips — dijelasin santai.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${bodyF.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <BlogNav />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: `blog.css`** — KANAL tokens (violet, light+dark via `[data-ktheme]`), and classes `.k-wrap/.k-nav/.k-chip/.k-card/.k-hero/.k-dots`. Base:

```css
:root{--k-accent:#6d5efc;--k-accent-2:#a78bfa;--k-bg:#fbfbfd;--k-surface:#fff;--k-line:#ececf1;--k-ink:#111;--k-muted:#6b6b73;--k-radius:12px}
:root[data-ktheme="dark"]{--k-accent:#8b7dff;--k-bg:#0d0d11;--k-surface:#17171e;--k-line:#26262f;--k-ink:#fff;--k-muted:#9a9aa2}
*{box-sizing:border-box}
body{margin:0;background:var(--k-bg);color:var(--k-ink);font-family:var(--k-body),system-ui,sans-serif;line-height:1.6}
.k-wrap{max-width:72rem;margin-inline:auto;padding-inline:clamp(1rem,4vw,2rem)}
.k-chip{font-family:var(--k-mono),monospace;font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.2rem .55rem;border-radius:20px;background:var(--k-accent);color:#fff}
.k-chip--out{background:transparent;border:1.5px solid var(--k-accent);color:var(--k-accent);border-radius:6px}
/* …cards, nav, prose, hero, dots — full tokens in this file… */
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
```
(Write the complete class set — nav, card grid, `.prose` for RichText, hero + dots — following the mockups: Space Grotesk display, JetBrains Mono labels, entertainment card = cover + filled chip, tech card = outline chip.)

- [ ] **Step 4: `BlogNav.tsx`** (wordmark `KANAL.` + category tabs linking `/`, `/?cat=hiburan` … + `ThemeToggle`) and `ThemeToggle.tsx` (client, toggles `data-ktheme` + `localStorage 'kanal-theme'`; mirror the existing `(frontend)/components/ThemeToggle.tsx`).

- [ ] **Step 5: Verify host rewrite.** `pnpm --filter web dev`, then:

Run: `curl -s -H "Host: blog.tncp.web.id" http://localhost:3000/ -o /dev/null -w "%{http_code}\n"`
Expected: `200` served by the blog layout (once Task 7 exists; for now a placeholder `_blog/page.tsx` returning "KANAL" is fine). `curl` without the blog Host still serves the portfolio.

- [ ] **Step 6: Typecheck + build + commit**

```bash
git add apps/web/src/middleware.ts "apps/web/src/app/(blog)" 
git commit -m "feat(blog): (blog) route group — KANAL layout, tokens, nav, theme toggle, host middleware"
```

---

### Task 7: Blog index page (hero slot + category tabs + card grid + load-more)

**Files:**
- Create: `apps/web/src/app/(blog)/_blog/page.tsx`
- Create: `apps/web/src/app/(blog)/components/ArticleCard.tsx`

**Interfaces:**
- Consumes: `getFeaturedArticles`, `getArticles` (Task 5); `Hero` (Task 8, imported).
- Produces: the beranda at blog `/` with `?cat=` filter.

- [ ] **Step 1: `ArticleCard.tsx`** — server component; entertainment categories (`hiburan|kpop|film`) render cover + filled `.k-chip`; `tech|tips` render outline chip + cleaner body; shows `readingTime`. Uses `mediaUrl` helper (copy from portfolio page).

- [ ] **Step 2: `page.tsx`:**

```tsx
import { getFeaturedArticles, getArticles } from "@/lib/blog";
import { Hero } from "../components/Hero";
import { ArticleCard } from "../components/ArticleCard";

export const dynamic = "force-dynamic";
const TABS = [["", "Semua"],["hiburan","Hiburan"],["kpop","K-Pop"],["film","Film"],["tech","Tech"],["tips","Tips"]] as const;

export default async function BlogHome({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const [featured, list] = await Promise.all([getFeaturedArticles(), getArticles({ category: cat, limit: 12 })]);
  return (
    <main className="k-wrap">
      {!cat && featured.length > 0 ? <Hero slides={featured} /> : null}
      <nav className="k-tabs">
        {TABS.map(([v, label]) => (
          <a key={v} href={v ? `/?cat=${v}` : "/"} className={`k-tab${(cat ?? "") === v ? " k-tab--active" : ""}`}>{label}</a>
        ))}
      </nav>
      <div className="k-grid">
        {list.docs.map((a) => <ArticleCard key={a.id} article={a} />)}
      </div>
      {list.docs.length === 0 ? <p className="k-empty">Belum ada artikel.</p> : null}
    </main>
  );
}
```
(Load-more: start server-rendered page 1; a small client "Muat lagi" that fetches `/?cat=&page=n` is optional — ship page-1 + tab filter first; add pagination only if needed. `// ponytail: page-1 only for launch, add cursor pagination when volume warrants`.)

- [ ] **Step 3: Typecheck + build.** Run: `pnpm --filter web typecheck && pnpm --filter web build` — Expected PASS.

- [ ] **Step 4: Seed + visual check.** Ingest 3–4 articles across categories (Task 3 curl) + publish (Task 4), then load `curl -H "Host: blog.tncp.web.id" http://localhost:3000/` and open in a browser via the dev host trick. Confirm grid + tabs + hero render.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(blog)/_blog/page.tsx" "apps/web/src/app/(blog)/components/ArticleCard.tsx"
git commit -m "feat(blog): index page — hero slot, category tabs, article grid"
```

---

### Task 8: Hero carousel (client component)

**Files:**
- Create: `apps/web/src/app/(blog)/components/Hero.tsx`

**Interfaces:**
- Consumes: `Article[]` (slides, ≤5).
- Produces: `<Hero slides={Article[]}>` — locked 16:9 (4:3 mobile via CSS), autoplay ~6s, pause on hover/focus, **dot hover-scrub with ~400ms dwell**, fixed-size dots, small arrows, reduced-motion → no autoplay.

- [ ] **Step 1: Write `Hero.tsx`** (`"use client"`):

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Slide = { slug: string; title: string; category: string; publishedAt?: string | null; coverImage?: unknown };
const AUTOPLAY_MS = 6000, DWELL_MS = 400;
const mediaUrl = (v: unknown) => (typeof v === "object" && v && "url" in v ? (v as { url?: string }).url ?? null : null);
const CAT: Record<string,string> = { hiburan:"HIBURAN", kpop:"K-POP", film:"FILM", tech:"TECH", tips:"TIPS" };

export function Hero({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (paused || reduce || slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reduce, slides.length]);

  const hoverDot = (n: number) => { if (dwell.current) clearTimeout(dwell.current); dwell.current = setTimeout(() => setI(n), DWELL_MS); };
  const leaveDot = () => { if (dwell.current) clearTimeout(dwell.current); };

  if (!slides.length) return null;
  const s = slides[i];
  const cover = mediaUrl(s.coverImage);
  return (
    <section className="k-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} aria-roledescription="carousel">
      <a className="k-hero__link" href={`/${s.slug}`} aria-label={s.title}>
        {cover ? <img className="k-hero__img" src={cover} alt="" /> : <div className="k-hero__img k-hero__img--ph" />}
        <div className="k-hero__scrim" />
        <div className="k-hero__text">
          <span className="k-chip">{CAT[s.category] ?? s.category}</span>
          <h2 className="k-hero__title">{s.title}</h2>
        </div>
      </a>
      <button className="k-hero__arrow k-hero__arrow--prev" aria-label="Sebelumnya" onClick={() => setI((i - 1 + slides.length) % slides.length)}>‹</button>
      <button className="k-hero__arrow k-hero__arrow--next" aria-label="Berikutnya" onClick={() => setI((i + 1) % slides.length)}>›</button>
      <div className="k-dots" role="tablist">
        {slides.map((_, n) => (
          <button key={n} className={`k-dot${n === i ? " k-dot--on" : ""}`} aria-label={`Slide ${n + 1}`} aria-selected={n === i}
            onMouseEnter={() => hoverDot(n)} onMouseLeave={leaveDot} onFocus={() => setI(n)} onClick={() => setI(n)} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Hero CSS** in `blog.css`: `.k-hero{position:relative;aspect-ratio:16/9;max-height:30rem;border-radius:14px;overflow:hidden}` (mobile `@media(max-width:640px){.k-hero{aspect-ratio:4/3}}`), `.k-hero__img{width:100%;height:100%;object-fit:cover}`, scrim lower-left gradient, `.k-dot{width:6px;height:6px;border-radius:50%;border:0;padding:0;background:rgba(255,255,255,.45)}` fixed size, `.k-dot--on{background:#fff}`, small `.k-hero__arrow`. No layout shift on active dot.

- [ ] **Step 3: Typecheck + build.** Run: `pnpm --filter web typecheck && pnpm --filter web build` — Expected PASS.

- [ ] **Step 4: Manual interaction check** (browser via blog Host): autoplay advances ~6s; hovering hero pauses; hovering a dot switches after ~0.4s; dots don't resize/shift; arrows small; reduced-motion (DevTools emulate) stops autoplay.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(blog)/components/Hero.tsx" "apps/web/src/app/(blog)/blog.css"
git commit -m "feat(blog): hero carousel — autoplay, dot hover-scrub, locked aspect, a11y"
```

---

### Task 9: Article detail page

**Files:**
- Create: `apps/web/src/app/(blog)/_blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getArticleBySlug`, `getRelated` (Task 5); `ArticleCard` (Task 7).
- Produces: `/blog <slug>` article page + `generateMetadata` (title, excerpt, OG cover).

- [ ] **Step 1: Write `[slug]/page.tsx`** (mirror the portfolio detail page + `.prose` + `RichText`):

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getArticleBySlug, getRelated } from "@/lib/blog";
import { ArticleCard } from "../../components/ArticleCard";

type Params = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
const mediaUrl = (v: unknown) => (typeof v === "object" && v && "url" in v ? (v as { url?: string }).url ?? null : null);
const CAT: Record<string,string> = { hiburan:"HIBURAN", kpop:"K-POP", film:"FILM", tech:"TECH", tips:"TIPS" };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return { title: "Tak ditemukan" };
  const cover = mediaUrl(a.coverImage);
  return { title: a.title, description: a.excerpt || undefined, openGraph: cover ? { images: [cover] } : undefined };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) notFound();
  const cover = mediaUrl(a.coverImage);
  const related = await getRelated(a.category, a.slug!);
  const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" }) : "";
  return (
    <main className="k-wrap k-article">
      <a className="k-back" href="/">← Semua</a>
      {cover ? <img className="k-article__cover" src={cover} alt={a.title} /> : null}
      <span className="k-chip">{CAT[a.category] ?? a.category}</span>
      <h1 className="k-article__title">{a.title}</h1>
      <p className="k-article__meta">{date}{a.readingTime ? ` · ${a.readingTime} mnt baca` : ""}</p>
      {a.body ? <div className="prose"><RichText data={a.body} /></div> : null}
      {Array.isArray(a.sources) && a.sources.length > 0 ? (
        <div className="k-sources"><h3>Sumber</h3><ul>{a.sources.map((s: any, n: number) => <li key={n}><a href={s.url} target="_blank" rel="noreferrer">{s.label || s.url} ↗</a></li>)}</ul></div>
      ) : null}
      {related.length > 0 ? <div className="k-related"><h3>Terkait</h3><div className="k-grid">{related.map((r) => <ArticleCard key={r.id} article={r} />)}</div></div> : null}
    </main>
  );
}
```

- [ ] **Step 2: Add `.k-article`, `.k-sources`, `.k-related` styles to `blog.css`** (reading-optimized `.prose` width ~68ch, cover locked aspect).

- [ ] **Step 3: Typecheck + build + manual check** (open a published article via blog Host). Confirm cover, prose, sources, related, meta `tanggal · N mnt baca`. Draft article (unpublished) → 404.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(blog)/_blog/[slug]/page.tsx" "apps/web/src/app/(blog)/blog.css"
git commit -m "feat(blog): article page — cover, prose body, sources, related, OG metadata"
```

---

### Task 10: SEO — blog sitemap + RSS

**Files:**
- Create: `apps/web/src/app/(blog)/_blog/sitemap.ts`
- Create: `apps/web/src/app/(blog)/_blog/rss.xml/route.ts`

**Interfaces:**
- Consumes: `getArticles` (Task 5).
- Produces: `blog.tncp.web.id/sitemap.xml` + `/rss.xml`.

- [ ] **Step 1: `sitemap.ts`** — list published article URLs (`getArticles({limit:1000})`), `base = NEXT_PUBLIC_BLOG_URL`.
- [ ] **Step 2: `rss.xml/route.ts`** — a `GET` returning `Content-Type: application/rss+xml` with the latest ~20 articles (title, link, `pubDate`, `description=excerpt`). No external lib — build the XML string.
- [ ] **Step 3: Typecheck + build + curl** both endpoints via blog Host; validate XML is well-formed (`curl … | head`).
- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(blog)/_blog/sitemap.ts" "apps/web/src/app/(blog)/_blog/rss.xml/route.ts"
git commit -m "feat(blog): sitemap + RSS feed"
```

---

### Task 11: Reveal Blog nav on tncp.web.id + docs + drift fix

**Files:**
- Modify: `apps/web/src/app/(frontend)/components/SiteNav.tsx` (Blog link when `NEXT_PUBLIC_BLOG_URL` set — verify it already reads it; wire if not)
- Modify: `.env.example` (already has `NEXT_PUBLIC_BLOG_URL`; add `INGEST_SECRET=`)
- Modify: `docs/codemap.md`, `docs/architecture.md` (fix `3000`→`3100` drift + add blog + ingest rows), `docs/business-flow.md` (article lifecycle → published via ingest)

**Interfaces:**
- Produces: complete, documented feature.

- [ ] **Step 1:** Confirm/patch `SiteNav.tsx` renders a **Blog** link to `process.env.NEXT_PUBLIC_BLOG_URL` when set (empty hides it — per `.env.example`).
- [ ] **Step 2:** Add `INGEST_SECRET=` to `.env.example` under a `# ── Blog ingest ──` block.
- [ ] **Step 3:** Update `docs/codemap.md` (new rows: `(blog)` group, `middleware.ts`, `lib/blog.ts`, `lib/ingest.ts`, ingest routes; flip the Phase-2 markers), fix `architecture.md` port drift (`127.0.0.1:3000`→note host `3100`→container `3000`), update `business-flow.md` article lifecycle. Refresh each `Last verified` line.
- [ ] **Step 4:** Typecheck + build.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(frontend\)/components/SiteNav.tsx .env.example docs/codemap.md docs/architecture.md docs/business-flow.md
git commit -m "feat(blog): reveal Blog nav; docs + architecture drift fix"
```

---

## Self-review notes (author)

- **Spec coverage:** content model (T1), md→lexical + reading time (T2), ingest create/publish (T3/T4), data layer (T5), branded route group + subdomain middleware (T6), index + tabs (T7), hero dot-scrub (T8), article + sources + related (T9), SEO/RSS (T10), nav reveal + docs/drift (T11). `source=ai` private = never rendered (no source field in any page). id-only = every query passes `locale:"id"`. ✓
- **Deferred to Plan 2 (PAI):** cover generation, feature_score assignment, IG pause, Telegram approve + delay-window, publish trigger. Plan 1 is testable standalone via `/admin` + curl.
- **Risk:** the `(blog)` route-group + host-rewrite target (`_blog` folder) — validate in T6 Step 5 before building pages on it; if Next multiple-root-layout rules conflict, fall back to a dedicated layout under `app/_blog/layout.tsx` without a `(blog)` group.
- **Open:** `markdownToLexical` exact export verified in T2 Step 1 before use.
