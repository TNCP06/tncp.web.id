# Data model

> Last verified against code: 2026-07-03 (Stage A scaffold — schema lands in Stage B)

Planned collections/globals (full field lists in the prompt spec):

- **Global `profile`** — fullName, headline, bio, photo, location, email, socials[], cvFile, availableForWork.
- **Collection `portfolio-entries`** (drafts on) — title, slug, entryType, summary, body, role, organization, dates, isOngoing, techStack[], links[], coverImage, gallery[], featured, priorityScore, curation{}.
- **Collection `articles`** (drafts on; UI Phase 2) — title, slug, excerpt, body, coverImage, tags[], source.
- **Collection `users`** — auth, `role` (admin|agent), API key enabled.
- **Collection `media`** — uploads to `/data/media`.

Fill exact field types + relations here once the Payload config exists (Stage B).
