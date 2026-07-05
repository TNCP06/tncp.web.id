# tncp.web.id

Personal platform — profile, portfolio, and the **KANAL** blog — for Tionusa Catur
Pamungkas, backend developer.

[![CI](https://github.com/TNCP06/tncp.web.id/actions/workflows/ci.yml/badge.svg)](https://github.com/TNCP06/tncp.web.id/actions/workflows/ci.yml)
[![Deploy](https://github.com/TNCP06/tncp.web.id/actions/workflows/deploy.yml/badge.svg)](https://github.com/TNCP06/tncp.web.id/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?logo=next.js)
![Payload CMS](https://img.shields.io/badge/Payload_CMS-3-000?logo=payloadcms)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm)

A **pnpm workspaces + Turborepo** monorepo. The Phase 1 app is `apps/web`: Next.js
(App Router) with **Payload CMS 3 embedded** — one process serving the public site, `/admin`,
the REST/GraphQL API, and uploads. SQLite for storage, self-hosted on EC2 behind a Cloudflare
Tunnel. No Vercel.

The blog (`blog.tncp.web.id`) is served by the same app and fed by the separate
[PAI](https://github.com/TNCP06/PAI) content pipeline through an `INGEST_SECRET`-guarded
ingest API.

## Quick start (local dev)

```bash
corepack enable             # first time only — activates pnpm
pnpm install
cp .env.example .env         # then set PAYLOAD_SECRET (openssl rand -base64 32)
pnpm dev                     # http://localhost:3000
```

Useful scripts: `pnpm typecheck`, `pnpm build`, `pnpm --filter web seed` (dev seed data),
`pnpm --filter web payload migrate:create <name>` (after a schema change).

## Layout

- `apps/web` — public site + `/admin` + REST/GraphQL API + uploads (Payload embedded); the
  blog lives here as the `(blog)` route group
- `docs/` — architecture, code map, data model, deployment, backup (English)
- `packages/` — shared code, created only when used by more than one app
- `scripts/` — host-side operations (e.g. `backup.sh`)

## Docs

Start at [`docs/codemap.md`](docs/codemap.md) — it maps each area to the files you need to
read. Big picture: [`docs/architecture.md`](docs/architecture.md). See also
[`docs/data-model.md`](docs/data-model.md), [`docs/business-flow.md`](docs/business-flow.md),
[`docs/deployment.md`](docs/deployment.md), and [`docs/backup.md`](docs/backup.md).

## Deploy

Push to `main` → GitHub Actions builds the Docker image → GHCR → the VPS runs
`docker compose pull && up -d`. **The VPS never builds** (OOM risk). See
[`docs/deployment.md`](docs/deployment.md).
