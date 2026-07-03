# Code map

> Last verified against code: 2026-07-03 (Stage B — Payload embedded)
> Purpose: token-cheap entry point. For each area, read only the files listed.

| Area | Read |
|---|---|
| Root tooling | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.env.example` |
| Payload config | `apps/web/src/payload.config.ts` |
| Collections | `apps/web/src/collections/{Users,Media,PortfolioEntries,Articles}.ts` |
| Globals | `apps/web/src/globals/Profile.ts` |
| Access control + agent guardrails | `apps/web/src/access.ts` |
| Slug helper | `apps/web/src/fields/slug.ts` |
| Admin panel (route group) | `apps/web/src/app/(payload)/admin/**`, `(payload)/layout.tsx` |
| REST + GraphQL API | `apps/web/src/app/(payload)/api/**` |
| Healthcheck | `apps/web/src/app/(payload)/api/health/route.ts` (static, shadows `/api/[...slug]`) |
| Public site (frontend group) | `apps/web/src/app/(frontend)/**` |
| Public routing/detail pages | *(Stage C)* `apps/web/src/app/(frontend)/**` |
| Host middleware (blog) | *(Phase 2)* `apps/web/src/middleware.ts` |
| Revalidation hooks | *(Stage C)* inside collection `hooks` → `revalidateTag`/`revalidatePath` |
| Backup | *(Stage F)* `scripts/backup.sh` |
| CI/CD | *(Stage E)* `.github/workflows/*`, `apps/web/Dockerfile`, `docker-compose.yml` |

Notes:
- `apps/web` is `"type": "module"` (Payload CLI needs ESM).
- No top-level `app/layout.tsx` on purpose: `(frontend)` and `(payload)` are separate root layouts (Payload requirement).

Update this table whenever the structure changes.
