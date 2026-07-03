# Business flow

> Last verified against code: 2026-07-03 (Stage A scaffold)

## Portfolio entry lifecycle

- **Now (manual)**: the owner creates/edits a `portfolio-entry` in `/admin`, saves as a draft, then publishes. Only published entries reach the public site.
- **Phase 3 (AI)**: the agent creates `source=ai` drafts (never publishes/deletes); the owner approves via a Telegram/Discord bot → publish.

## Ordering on the homepage

`featured` (desc) → `priorityScore` (desc) → `startDate` (desc).

## Article lifecycle

Schema exists from Stage B; public UI is Phase 2. Same draft → publish rule.

## Content path

Admin edit → publish → Payload `afterChange` hook → `revalidate*` → the public page updates without a restart.
