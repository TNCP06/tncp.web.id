# Data model

> Last verified against code: 2026-07-03 (Blog Phase 2 Task 1 — `apps/web/src/collections/Articles.ts`, `apps/web/src/hooks/revalidate.ts`)

Localization: locales `id` (default) + `en`, fallback on. Fields marked *(loc)* are localized.

## Global `profile` (`globals/Profile.ts`)

Public read; admin-only update.

| Field | Type | Notes |
|---|---|---|
| fullName | text | required |
| headline | text | *(loc)* |
| bio | richText | *(loc)* |
| photo | upload → media | |
| location | text | *(loc)* |
| email | email | |
| socials | array | { label, url, kind: github\|linkedin\|other } |
| cvFile | upload → media | |
| availableForWork | checkbox | default true |

## Collection `portfolio-entries` (`collections/PortfolioEntries.ts`)

Drafts on. Read: published-only for public, all for logged-in. Create: admin+agent. Update: admin any / agent drafts-only. Delete: admin.

| Field | Type | Notes |
|---|---|---|
| title | text | required, *(loc)* |
| slug | text | unique, auto from title (`fields/slug.ts`) |
| entryType | select | project\|work_experience\|education\|other (default project) |
| summary | textarea | maxLength 300, *(loc)* |
| body | richText | *(loc)* |
| role | text | *(loc)* |
| organization | text | *(loc)* |
| startDate / endDate | date | |
| isOngoing | checkbox | default false |
| techStack | text hasMany | simple string list |
| links | array | { label, url, kind: github\|demo\|docs\|other } |
| coverImage | upload → media | |
| gallery | upload → media (hasMany) | |
| featured | checkbox | default false |
| priorityScore | number | default 0 |
| curation | group | { source manual\|ai, status draft\|approved\|rejected, sourceRepo, aiRationale, rubricScores (json), curatedAt } |

## Collection `articles` (`collections/Articles.ts`)

Drafts on; same access as portfolio-entries. Public UI is Phase 2.

| Field | Type | Notes |
|---|---|---|
| title | text | required, *(loc)* |
| slug | text | unique, auto from title |
| excerpt | textarea | *(loc)* |
| body | richText | *(loc)* |
| coverImage | upload → media | |
| tags | text hasMany | |
| source | select | manual\|ai (default manual) |
| category | select | hiburan\|kpop\|film\|tech\|tips (default tech), required |
| sources | array | { url (required), label } |
| externalId | text | unique, sidebar, read-only |
| featured | checkbox | default false |
| featuredScore | number | default 0 |
| readingTime | number | read-only |

Revalidation tags (`hooks/revalidate.ts`): `articles`, `article:<slug>`, `blog-featured`.

## Collection `users` (`collections/Users.ts`)

Auth + `useAPIKey`. Admin-only access (first-user creation bypasses this). Field: `role` (admin\|agent).

## Collection `media` (`collections/Media.ts`)

Public read; admin write. `staticDir = MEDIA_DIR` (default `./data/media`). Field: `alt` *(loc)*.

## Access & agent guardrails (`access.ts`)

- `publishedOrLoggedIn`, `updateDraftsForAgent`, `isAdmin`, `isAdminOrAgent`.
- `forceAgentDraft` beforeChange hook: agents can never publish (forced to draft).
- Phase 3 TODO: force `source=ai` for agent writes; block edits to `source=manual` docs.
