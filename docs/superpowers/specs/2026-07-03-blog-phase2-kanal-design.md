# Blog Phase 2 — "KANAL." design

> Status: approved design (brainstorm). Date: 2026-07-03.
> Scope: the public blog for `tncp.web.id`, its content model, and the ingestion
> pipeline that feeds it from the **Personal-Assistant-AI** (PAI) content bot.
> Two repos are involved; this spec is the shared contract.

## 1. Goal

Ship the public blog (Phase 2, foreseen since Stage B's `articles` collection) as a
**separately-branded** section — **KANAL.** — served on `blog.tncp.web.id`. Content is
produced by PAI (research → write → cover image) and pushed to Payload as **drafts**,
then published via a delay-window/approval mechanism that supports both **manual approval**
and **hands-off auto-publish**.

Non-goals now: Instagram (paused until the account exists), English translations of AI
articles, a recommendation engine.

## 2. Locked decisions

| # | Decision |
|---|---|
| D1 | Blog is a **subdomain** `blog.tncp.web.id`, same `apps/web` process, host-middleware rewrite to a `(blog)` route group. |
| D2 | **Own brand** (not the portfolio's Neo-Systems Grid): name **KANAL.**, accent **violet `#6d5efc`**, one theme with **light + dark**. Fonts: Space Grotesk (display) / JetBrains Mono (labels) / Inter (body). |
| D3 | **One accent, category = label only** (no per-category palettes). Tone difference comes from content: entertainment shows a vivid cover; tech shows a code chip + cleaner layout. |
| D4 | **id only** for the blog (bilingual was a tncp.web.id-page idea; not the blog). `en` falls back to `id`. |
| D5 | Content flow: PAI creates a **draft** (agent-key path stays draft-only) → Telegram **Approve/Reject** + **delay-window** → publish via a **trusted ingest endpoint** (shared secret, not the agent key). Config knobs give full-auto / hybrid / strict. |
| D6 | **`source=ai` is private** (admin audit only) — never rendered publicly. |
| D7 | Every article gets an **AI-generated cover** (agy). IG is paused, so image budget goes to covers. |
| D8 | **All genres → article** (tech included, permanently). IG becomes an additive path later, not a replacement. |
| D9 | Homepage **hero carousel** of AI-featured articles (see §6.2). |

## 3. Architecture

```
Personal-Assistant-AI (Python repo, VPS)             tncp.web.id  apps/web (VPS, same box)
──────────────────────────────────────              ─────────────────────────────────────
research → write(article) → cover(agy)   ── multipart ─►  POST /api/ingest/article   [INGEST_SECRET]
        → ready_to_publish                                 ├─ markdown → Lexical richText
        │                                                  ├─ cover file → media collection
        │   Telegram Approve/Reject + delay-window         └─ upsert by externalId → DRAFT (source=ai)
        └─ approve OR timeout(if AUTOPUBLISH) ─────────►   POST /api/ingest/article/[id]/publish
                                                            └─ _status=published → afterChange → revalidate
                                                                                        │
                                          blog.tncp.web.id  ◄── host middleware ── (blog) route group ◄┘
```

Two repos, cross-repo over HTTPS through the existing Cloudflare Tunnel. **PAI stays a
separate Python repo** — not merged into the Node monorepo (different ecosystems). The
monorepo structure (`apps/web`, `packages/*` empty by design) is unchanged and correct.

## 4. tncp.web.id — content model

Extend `apps/web/src/collections/Articles.ts`. **New/renamed fields → a committed Payload
migration** (`pnpm --filter web payload migrate:create blog_phase2`; never hand-edit prod DDL).

| Field | Type | Notes |
|---|---|---|
| title | text, required, localized | existing |
| slug | text, unique | existing |
| excerpt | textarea, localized | existing |
| body | richText (Lexical), localized | existing; populated from markdown on ingest |
| coverImage | upload → media | existing; always set by PAI |
| tags | text hasMany | existing |
| source | select manual\|ai | existing; **admin-only, never public** |
| **category** | select: `hiburan`,`kpop`,`film`,`tech`,`tips` | new — from PAI genre map (§7) |
| **sources** | array `{ url, label }` | new — reference list rendered at article foot |
| **externalId** | text, unique, index | new — PAI job key → ingest idempotency (upsert) |
| **featured** | checkbox, default false | new — hero eligibility |
| **featuredScore** | number, default 0 | new — AI-assigned 0–100; hero ordering |
| **readingTime** | number (min) | new — computed on ingest (~200 wpm); public; shown on cards, **not** the hero |

`forceAgentDraft` and the existing access rules are unchanged.

## 5. tncp.web.id — ingest API

Two plain Next route handlers under `apps/web/src/app/(payload)/api/ingest/…` (or a
dedicated `(ingest)` group), **guarded by an `INGEST_SECRET` header** — not the Payload
agent key, so `forceAgentDraft` still fully applies to any real agent traffic. Writes use
the Payload **Local API** server-side.

### `POST /api/ingest/article`
- Auth: `Authorization: Bearer <INGEST_SECRET>`.
- Body: `multipart/form-data` — `payload` (JSON) + optional `cover` (image file).
- JSON: `{ externalId, title, bodyMarkdown, excerpt, category, tags[], sources[], featured, featuredScore, locale:"id" }`.
- Steps: validate → convert `bodyMarkdown` → Lexical (`@payloadcms/richtext-lexical` markdown converter) → if `cover`, create a `media` doc → **upsert** the `articles` doc by `externalId` as a **draft**, `source=ai`, `readingTime` computed (~200 wpm) → return `{ id, slug, status:"draft", adminUrl }`.
- Idempotent: re-posting the same `externalId` updates the existing draft (no duplicates).

### `POST /api/ingest/article/[id]/publish`
- Auth: same secret.
- Effect: set `_status=published` via Local API (server-side, trusted → not blocked by `forceAgentDraft`). The collection's `afterChange` revalidation fires (`revalidateTag('articles')`, `article:<slug>`, `blog-featured`). Returns `{ id, slug, url }`.
- Idempotent: publishing an already-published id is a no-op success.

## 6. tncp.web.id — blog frontend (`(blog)` route group)

New root layout `apps/web/src/app/(blog)/layout.tsx` with KANAL brand tokens (separate CSS
from the portfolio's `globals.css`; violet accent, light+dark via the same `data-theme`
mechanism + a toggle). Host routing: `apps/web/src/middleware.ts` rewrites requests whose
`Host` is `blog.tncp.web.id` to `/(blog)/…`. Data via the existing `lib/payload.ts`
Local-API + `unstable_cache` tag pattern.

### 6.1 Pages
- `/(blog)/page.tsx` — **beranda**: hero carousel (§6.2) + category tabs (Semua/Hiburan/K-Pop/Film/Tech/Tips) + card grid + load-more. Published articles only.
- `/(blog)/[slug]/page.tsx` — **article**: cover (locked aspect, `object-fit:cover`), title, meta `tanggal · GENRE`, `.prose` body, **sources footer**, back link, related (same category, latest). SSG + tag revalidation.
- `sitemap` for blog hosts, per-article OG tags (cover image), and an **RSS feed** (`/(blog)/rss.xml`).

### 6.2 Hero carousel (locked interaction)
- **AI-featured**: query `featured=true` ordered by `featuredScore desc, publishedAt desc`, limit **5**. Fallback: latest 5 published if none featured. Cache tag `blog-featured`.
- **Aspect locked**: `aspect-ratio:16/9` desktop, `4/3` mobile, `object-fit:cover`, max-height cap, contained (not full-bleed) → never squished.
- **Autoplay**: 5 slides, ~6s each; **pause on hover/focus** of the hero; `prefers-reduced-motion` → autoplay off (manual still works).
- **Dots** (bottom-right): all **fixed 6px, fixed spacing** — active differs by **color only** (solid white), never resizes. **Hover a dot → after ~0.4s dwell, the hero switches to that slide** (scrub in place; not a popup, not a navigation). Click dot/arrow = jump immediately.
- **Arrows**: small, subtle, ‹ ›.
- **Text**: headline + meta `tanggal · GENRE` (genre in violet; **no reading-time in the hero**). Scrim gradient only lower-left + width-capped headline + subtle text-shadow → legible without covering the image. **No "PILIHAN KANAL" badge.**
- Mobile: swipe.

### 6.3 Cards
Grid cards flex by content: entertainment → cover image on top + filled violet category chip; tech → cleaner card + outline chip + optional code chip; reading-time may appear on cards (not the hero). All one accent.

## 7. Personal-Assistant-AI — changes

### 7.1 Pause Instagram, reroute to articles
- New `.env` flag `INSTAGRAM_ENABLED=0`. When 0: **all genres map to `type=article`** (the `stage_write` genre→type rule); the IG image/publish stages are skipped and their cron lines are inert. IG code stays for later.

### 7.2 Article cover step
- After `stage_write` (article), generate **one cover** via agy (new prompt `prompts/article_cover.md` — editorial cover for the topic; no carousel/slide framing). Store locally under `data/images/job_<id>/cover.png`. Skip vision-review on covers (budget; you'll see it in the approve step).

### 7.3 Blog-publish stage (replaces the BLOG-INTEGRATION.md stub)
- `POST` cover + JSON to `BLOG_INGEST_URL/api/ingest/article` (draft) → store returned article id.
- Send Telegram **Approve/Reject** inline buttons (the bot built this session) + start a **delay-window** (reuse the IG `control/` flag pattern: listener writes `blog_approve_<id>.flag` / `blog_reject_<id>.flag`).
- Resolve:
  - **Approve** (button) → call publish endpoint.
  - **Reject** (button) → leave draft (finish in `/admin`).
  - **Window timeout** → publish **iff** `BLOG_AUTOPUBLISH=1`, else leave draft.
- On publish success → `sm.mark_posted(job, post_id=<article id>)` (idempotent).

### 7.4 AI "featured" selection
- During `stage_write`, the article prompt also emits `feature_score` (0–100) and `featured` (bool) — the LLM's judgment of hero-worthiness (big story, strong angle). Passed through ingest to `featuredScore`/`featured`.

### 7.5 Config knobs (`.env`)
`INSTAGRAM_ENABLED`, `BLOG_INGEST_URL`, `INGEST_SECRET`, `BLOG_AUTOPUBLISH`, `BLOG_APPROVE_WINDOW_MIN`.
Trust-graduated default: start `BLOG_AUTOPUBLISH=0` (strict review) for ~2 weeks, then flip to `1` (auto).

### 7.6 Genre → category map
`tech→tech`, `ent_id→hiburan`, `kpop→kpop`, `hollywood→film`. "tips/tutorial" is a tech sub-flavor via `tags` for now (not a research genre).

## 8. Guardrail resolutions (owner-requested review)
- **`forceAgentDraft` vs automation** → keep it; publish happens through the separate secret-guarded endpoint, not the agent key. Automation preserved, audit intact.
- **`source=ai`** → kept for admin audit, **never public**.
- **Bilingual** → blog is **id-only**; the id+en idea stays scoped to the main tncp.web.id pages.
- **Doc drift** → reconcile `docs/architecture.md` (says container `127.0.0.1:3000`) with `docs/deployment.md` (host port `3100`) in the implementing change.

## 9. Config / deploy (owner does the Cloudflare parts in parallel — see the separate guide)
- **Subdomain**: add a public-hostname `blog.tncp.web.id → <same container>` in the shared `cloudflared` config; add the DNS CNAME. Next `middleware.ts` does the host→`(blog)` rewrite.
- **Secrets/env**: tncp `.env` gains `INGEST_SECRET` (+ set `NEXT_PUBLIC_BLOG_URL=https://blog.tncp.web.id` to reveal the Blog nav button). PAI `.env` gains the §7.5 keys (same `INGEST_SECRET`). Generate an `agent` API key in `/admin` only if PAI also needs authenticated reads (publish path uses the secret, not the key).
- **Migration**: run `migrate:create`, commit; prod applies on deploy.
- **CI/CD & build-on-CI-only**: unchanged.

## 10. Out of scope / later
IG relaunch (flip `INSTAGRAM_ENABLED=1`, decide carousel-from-article vs own flow); English translations; related-article ranking beyond "same category, latest"; comments.

## 11. Risks
- **AI source-URL hallucination** (seen once in PAI research: a 404). Mitigation: the approve step is the human gate; consider a `curl -I` liveness filter on `sources` at ingest.
- **markdown→Lexical fidelity** for edge markdown (tables, embeds) — validate the converter on real PAI output during implementation; fall back to a `bodyMarkdown` mirror field only if needed.
- **Cover quality/consistency** from agy — same review-in-approve gate covers it.

## 12. Deliverables after this spec
1. This spec (committed).
2. Implementation plan (via writing-plans).
3. PAI `CLAUDE.md` working-contract (modeled on tncp's).
4. Cloudflare + external-config guide (subdomain hostname, DNS, secrets, env) for parallel owner prep.
