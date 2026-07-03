# tncp.web.id

Personal platform (profile + portfolio) for Tionusa Catur Pamungkas — backend developer.

Monorepo: **pnpm workspaces + Turborepo**. Phase 1 app is `apps/web` — Next.js (App Router) with **Payload CMS 3 embedded**, SQLite, self-hosted on EC2 behind Cloudflare Tunnel. No Vercel.

## Quick start (local dev)

```bash
corepack enable            # first time only — activates pnpm
pnpm install
cp .env.example .env        # then set PAYLOAD_SECRET (openssl rand -base64 32)
pnpm dev                    # http://localhost:3000
```

## Layout

- `apps/web` — public site + `/admin` + REST API + uploads (Payload embedded)
- `docs/` — architecture, code map, data model, deployment, backup (English)
- `packages/` — shared code, created only when used by >1 app

## Docs

Start at [`docs/codemap.md`](docs/codemap.md) — it maps each area to the files you need to read. Big picture: [`docs/architecture.md`](docs/architecture.md).

## Deploy

Push to `main` → GitHub Actions builds the image → GHCR → the VPS pulls. The VPS never builds. See [`docs/deployment.md`](docs/deployment.md).
