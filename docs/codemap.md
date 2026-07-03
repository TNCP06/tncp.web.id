# Code map

> Last verified against code: 2026-07-03 (Stage A scaffold)
> Purpose: token-cheap entry point. For each area, read only the files listed.

| Area | Read |
|---|---|
| Root tooling | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.env.example` |
| App entry | `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx` |
| Healthcheck | `apps/web/src/app/api/health/route.ts` |
| Public routing | *(Stage C)* `apps/web/src/app/**` |
| Payload config | *(Stage B)* `apps/web/src/payload.config.ts` |
| Collections | *(Stage B)* `apps/web/src/collections/*` |
| Globals | *(Stage B)* `apps/web/src/globals/*` |
| Host middleware (blog) | *(Phase 2)* `apps/web/src/middleware.ts` |
| Revalidation hooks | *(Stage B)* inside each collection's `hooks` |
| Backup | *(Stage F)* `scripts/backup.sh` |
| CI/CD | *(Stage E)* `.github/workflows/*`, `apps/web/Dockerfile`, `docker-compose.yml` |

Update this table whenever the structure changes.
