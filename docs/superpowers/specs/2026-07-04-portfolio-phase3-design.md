# Portfolio Phase 3 — AI curation design

> Status: approved design (brainstorm). Date: 2026-07-04.
> Scope: the automation that turns the owner's GitHub repos into **draft** portfolio
> entries, scored by a rubric, published on approval. Two repos; this spec is the
> shared contract. The portfolio **frontend already exists** (`ProjectLedger`,
> `/portfolio`) — Phase 3 only produces the data it renders.

## 1. Goal

Auto-curate `portfolio-entries` from the owner's GitHub: discover repos → score each
against `docs/curation-rubric.md` → push high scorers as **drafts** → owner
Approve/Reject on Telegram → publish. Modeled on the blog Phase 2 pipeline (same PAI
bot, same ingest+approval pattern). Non-goals now: cover-image generation for entries,
English translations, cloning/code analysis, work/education entries (projects only).

## 2. Locked decisions

| # | Decision |
|---|---|
| D1 | **Approach A** — a separate PAI module (`pipeline/portfolio.py`) + a `portfolio_candidates` table. Reuse notify / control-flag approval / `usage_guard` / the ingest pattern. **No change** to the content `jobs` table or its state machine. |
| D2 | **Source = auto-discover + pin/exclude.** List the owner's public repos via the GitHub API; drop forks/archived + a `PORTFOLIO_EXCLUDE` list; `PORTFOLIO_PIN` forces `featured`. |
| D3 | **Inspect depth = metadata + README + shallow file-tree** (detect `tests/`, `.github/workflows` CI, docs, LICENSE) — enough for the rubric's "completeness", no clone. |
| D4 | **Cadence = weekly cron + on-demand** (`run.py portfolio-scan`). Only new repos + existing **AI drafts** are (re)scored; approved/manual entries are never touched. |
| D5 | **Async approval** — same as the blog: draft persists (reviewable in `/admin`), Telegram Approve/Reject buttons resolve anytime via `control/` flags. |
| D6 | **Guardrails (rubric)** — draft-only, `curation.source=ai`, never publish/delete, never touch `source=manual`, base claims on README (flag missing info, don't invent). |
| D7 | **entryType = `project`** for all AI entries. Work/education stay manual. |
| D8 | **No cover generation** (repos aren't visual; the UI renders without covers). Additive later. |

## 3. Architecture

```
Personal-Assistant-AI (Python, VPS)                 tncp.web.id apps/web (same box)
──────────────────────────────────────             ──────────────────────────────────
portfolio-scan (weekly cron / manual)
  GitHub API: list repos (drop fork/archived/exclude)
  per new-or-changed repo:
    metadata + README + tree  ── score (claude, rubric) ──► priorityScore + rubricScores + fields
    if score >= MIN_SCORE ── multipart ─► POST /api/ingest/portfolio   [INGEST_SECRET]
        │                                   └─ markdown → Lexical, upsert by externalId → DRAFT (source=ai)
        │   Telegram Approve/Reject (async, control/ flags)
        └─ resolve (button / 15-min cron) ─► POST /api/ingest/portfolio/[id]/publish
                                              └─ curation.status=approved, _status=published → revalidate
                                                                          │
                                    tncp.web.id/portfolio  ◄── existing ProjectLedger UI ◄┘
```

Cross-repo over HTTPS through the existing tunnel; the ingest routes are host-agnostic
(under `(payload)/api/ingest`), so the **same base URL + `INGEST_SECRET`** as the blog
serve both `/article` and `/portfolio`.

## 4. tncp.web.id — ingest API (mirror of the blog's)

Two Next route handlers under `apps/web/src/app/(payload)/api/ingest/portfolio/…`,
guarded by the `INGEST_SECRET` bearer, using the Payload **Local API**. Shared markdown
converter: `@/lib/ingest` `markdownToLexical`.

### `POST /api/ingest/portfolio`
- Auth: `Authorization: Bearer <INGEST_SECRET>`.
- Body: `multipart/form-data` — `payload` (JSON). (No cover part — D8.)
- JSON: `{ externalId, title, entryType:"project", summary, bodyMarkdown, techStack[],
  links[{label,url,kind}], startDate?, endDate?, isOngoing?, featured, priorityScore,
  rationale, rubricScores{}, sourceRepo, locale:"id" }`. Required: `externalId, title`.
- Steps: validate → `bodyMarkdown` → Lexical `body` → **upsert `portfolio-entries` by
  `externalId`** (a hidden/sidebar field to add — see §5) as **draft**, setting
  `curation.source=ai, curation.status=draft, curation.sourceRepo, curation.aiRationale,
  curation.rubricScores, curation.curatedAt=now`, plus `priorityScore, featured,
  techStack, links, summary`.
- **On update: refuse if the existing doc has `curation.source=manual`** (409) — never
  overwrite a hand-made entry.
- Returns `201 {id, slug, status:"draft", adminUrl}`. Idempotent by `externalId`.

### `POST /api/ingest/portfolio/[id]/publish`
- Auth: same secret.
- Effect: `curation.status=approved` + `_status=published` via Local API. Refuse if
  `source=manual`. `afterChange` revalidation fires. Returns `200 {id, slug, url}`.
- Idempotent: re-publishing is a no-op success.

## 5. tncp.web.id — content model change

`PortfolioEntries` already has the `curation` group (`source, status, sourceRepo,
aiRationale, rubricScores, curatedAt`), `featured`, `priorityScore`, `techStack`,
`links`. **One new field** → committed Payload migration:

| Field | Type | Notes |
|---|---|---|
| **externalId** | text, unique, index, sidebar readOnly | new — repo full_name → ingest idempotency (upsert), mirrors Articles.externalId |

`forceAgentDraft` + access rules unchanged. Migration:
`pnpm --filter web payload migrate:create portfolio_external_id`, commit.

## 6. Personal-Assistant-AI — changes

### 6.1 GitHub client (`pipeline/github.py`, requests-only)
- `list_repos()` → owner's public repos via `GET /users/{GITHUB_USER}/repos?per_page=100`
  (paginate), auth `GITHUB_TOKEN` if set. Drop `fork`/`archived` + `PORTFOLIO_EXCLUDE`.
- `repo_detail(repo)` → `{name, full_name, description, html_url, homepage, language,
  languages{}, topics[], stargazers_count, pushed_at, created_at}` + README text
  (`GET /repos/{full}/readme`, base64) + a shallow tree scan
  (`GET /repos/{full}/git/trees/{default_branch}`) → flags `has_tests, has_ci, has_docs,
  has_license`.

### 6.2 `portfolio_candidates` table (schema.sql)
```
repo         TEXT PRIMARY KEY,        -- full_name
external_id  TEXT,                    -- == repo (ingest key)
entry_id     INTEGER,                 -- portfolio-entries id (after draft)
score        REAL,
status       TEXT,                    -- scored|awaiting|approved|rejected|below
pushed_at    TEXT,                    -- change detection
rationale    TEXT,
rubric_json  TEXT,                    -- per-criterion scores
created_at, updated_at TEXT
```

### 6.3 Stages (`pipeline/portfolio.py`)
- `stage_portfolio_scan()`:
  - `github.list_repos()`; for each repo: skip if a candidate exists with the same
    `pushed_at` **and** status in {awaiting, approved} (unchanged, already handled).
  - Guard `usage_guard.allowed("claude")`; gather detail; render `prompts/portfolio_score.md`
    (repo data + rubric) → claude → JSON `{priorityScore, rubricScores{5 criteria},
    rationale, entry:{title, summary, bodyMarkdown, techStack[], links[], isOngoing}}`.
  - Decision (rubric §Decision): `>=30` draft · `20–29` draft (rationale notes "with
    notes") · `<20` record `status=below`, no draft. `featured` = repo in `PORTFOLIO_PIN`
    OR among the top 3 candidate scores.
  - If draft: `portfolio.ingest_draft(...)` → store `entry_id`, `status=awaiting`; Telegram
    Approve/Reject buttons + Discord (score + rationale + budget snapshot).
  - Upsert the candidate row (dedup/change-tracking) throughout.
- `stage_portfolio_resolve()`: for `status=awaiting` candidates, read
  `control/pf_approve_<entry_id>.flag` / `pf_reject_<entry_id>.flag` → Approve →
  `portfolio.publish(entry_id)` → `status=approved`; Reject → `status=rejected` (leave
  draft). Timeout auto-publish only if `PORTFOLIO_AUTOPUBLISH=1` (default 0).
  - Candidates are keyed by `repo` (string), but flags + Telegram callbacks use the int
    `entry_id` (stable, short, exists once drafted): `pf_approve_<entry_id>` /
    `pf_reject_<entry_id>`.

### 6.4 `pipeline/portfolio_ingest.py` (or fold into portfolio.py; requests-only)
- `ingest_draft(*, external_id, title, entry_type, summary, body_markdown, tech_stack,
  links, featured, priority_score, rationale, rubric_scores, source_repo, is_ongoing)
  -> dict` → POST multipart `payload` JSON to `INGEST_BASE_URL/api/ingest/portfolio`.
- `publish(entry_id) -> dict` → POST `.../api/ingest/portfolio/<id>/publish`.
- Reuse `INGEST_SECRET`; base URL from a shared `INGEST_BASE_URL` (rename of / alias for
  the blog's `BLOG_INGEST_URL` — keep `BLOG_INGEST_URL` working).

### 6.5 `prompts/portfolio_score.md`
LLM-as-judge: given repo metadata + README + file-tree flags, score each rubric criterion
0–5, compute `priorityScore` (weighted, max 50), write a 1–2 sentence rationale, and
propose entry fields (title, summary ≤300 chars, bodyMarkdown, techStack from languages,
links). **Base every claim on the README/metadata; if info is missing, say so — never
invent.** Output strict JSON.

### 6.6 `run.py` + cron
- `run.py portfolio-scan` (weekly) + `run.py portfolio-resolve` (15-min + button-triggered
  via the listener spawning it, like `resolve-blog`).
- `telegram_listener.py`: callbacks `pf_approve_<id>` / `pf_reject_<id>` → write flag +
  spawn `portfolio-resolve`; `/portfolio` command shows candidates by status with buttons.
- `cron.template`: `SCHEDULE_PORTFOLIO_CRON` (weekly) → `portfolio-scan`; reuse the 15-min
  `resolve` line to also run `portfolio-resolve` (or a second 15-min line).

### 6.7 Config (`.env`)
`GITHUB_USER`, `GITHUB_TOKEN` (fine-grained read-only PAT — public repos, 5000/hr vs 60),
`PORTFOLIO_EXCLUDE` (csv repo names), `PORTFOLIO_PIN` (csv → featured),
`PORTFOLIO_MIN_SCORE` (default 20), `PORTFOLIO_AUTOPUBLISH` (default 0),
`INGEST_BASE_URL` (= the existing ingest base; same `INGEST_SECRET`),
`SCHEDULE_PORTFOLIO_CRON`.

## 7. Rubric mapping (`docs/curation-rubric.md` — source of truth)

Score 0–5 × weight; `priorityScore` = Σ (max 50):
Backend relevance ×3 · Technical depth ×3 · Completeness (README/tests/CI) ×2 ·
Uniqueness & impact ×1.5 · Recent activity ×0.5.
Decision: ≥30 propose · 20–29 propose w/ notes · <20 reject. `featured` = top 3.
The scoring prompt embeds this table verbatim; `rubricScores` stores the per-criterion 0–5.

## 8. Config / deploy
- **Migration**: `migrate:create portfolio_external_id`, commit; prod applies on deploy.
- **Secrets/env**: PAI `.env` gains §6.7 keys (same `INGEST_SECRET`). Generate a
  read-only GitHub PAT for `GITHUB_TOKEN`.
- **CI/CD**: unchanged (the ingest routes ride the existing image build).

## 9. Testing
- `tests/test_portfolio.py` (assert-based, requests-only, no boto3): rubric decision
  thresholds (score → draft/notes/below), repo filtering (fork/archived/exclude),
  change-detection (same `pushed_at` skip), `featured` top-3 + pins.
- GitHub API + claude scoring = live on the VPS (one real `portfolio-scan`, verify a draft
  appears in `/admin` and Approve publishes).

## 10. Risks
- **LLM hallucination** on repo purpose (rubric: base on README, flag gaps). The Approve
  gate is the human check; low scorers never draft.
- **GitHub rate limits** — mitigated by `GITHUB_TOKEN` + change-detection (skip unchanged).
- **Scoring drift/consistency** — `rubricScores` persisted for audit/recalibration;
  `MIN_SCORE` tunable.
- **`source=manual` collisions** — the ingest refuses to overwrite manual entries.

## 11. Deliverables
1. This spec (committed).
2. Implementation plan (via writing-plans).
