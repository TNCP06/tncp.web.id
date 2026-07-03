# Deployment

> Last verified against code: 2026-07-03 (Stage E — Docker + CI/CD authored; first deploy pending)

## Model

Push to `main` → GitHub Actions builds the Docker image and pushes it to GHCR (tags `latest` + commit SHA) → SSH to the VPS → `docker compose pull && up -d && docker image prune -f`. **The VPS never builds** (small EC2, OOM risk) — it only pulls.

The image ships the built `.next` plus production `node_modules` (`next start`), not `output: standalone` — Next's file tracer drops Payload's dynamically-required `libsql` sqlite driver, so standalone would boot without a database driver.

## Files

- `apps/web/Dockerfile` — multi-stage (deps → build → prod-deps → runner on `node:20-bookworm-slim`).
- `docker-compose.yml` — one service, `127.0.0.1:3000:3000`, volume `app-data:/data`, `mem_limit: 512m`, healthcheck on `/api/health`, label `com.tncp.project=tncp.web.id`.
- `.github/workflows/ci.yml` — PR + push: `pnpm typecheck` + `pnpm build`.
- `.github/workflows/deploy.yml` — push to `main`: build & push image to GHCR, then deploy over SSH.

## GitHub Secrets (values NOT stored in the repo)

| Secret | Purpose |
|---|---|
| `DEPLOY_HOST` | VPS host |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | dedicated deploy private key (not the owner's main key) |
| `DEPLOY_PATH` | app folder on the VPS (holds `docker-compose.yml` + `.env`) |

Image push authenticates with the built-in `GITHUB_TOKEN` (scope `packages: write`). For a **private** GHCR image the VPS logs in once with a PAT scoped `read:packages`.

## VPS one-time prep

1. Ensure swap exists (guards the build-independent runtime): see `panduan-manual.md`.
2. Create `DEPLOY_PATH`; copy `docker-compose.yml` + a filled `.env` (from `.env.example` — set `PAYLOAD_SECRET` via `openssl rand -base64 32`, `DATABASE_URI=file:/data/tncp.db`, `MEDIA_DIR=/data/media`, `SITE_URL=https://tncp.web.id`).
3. Private image: `docker login ghcr.io -u TNCP06` with a `read:packages` PAT.
4. Cloudflare Tunnel: point `tncp.web.id` → `localhost:3000`.
5. First run: `docker compose up -d`, then create the admin at `/admin`.

## Database bootstrap (current) and migrations (TODO)

Payload's `push` (schema auto-sync) only runs outside production, so a fresh prod SQLite file has no tables. Bootstrap: ship an initialized `data/tncp.db` (schema built locally by the same collections, plus placeholder seed) into the VPS bind mount once. The persistent bind mount keeps it across deploys, so redeploys keep working **as long as the schema doesn't change**.

**Debt:** a schema change (new/renamed field) needs real migrations. Proper fix: `payload migrate:create` locally, ship `src/migrations` + `tsx` in the image, and run `payload migrate` at container start. Do this before the next schema change.

## Networking

Host port is **3100** (`tcd` already uses 3000). The container listens on 3000; compose maps `127.0.0.1:3100:3000`. Cloudflare Tunnel routes `tncp.web.id` → the container — note `cloudflared` runs in another compose project, so it reaches this container via the Docker host gateway (`172.17.0.1:3100`) or by sharing a network, not `localhost`.

## Rollback

Deploy a previous image: `docker compose pull` a specific `sha-<commit>` tag (edit the image tag in compose or `docker compose up -d` after retagging), or re-run the deploy job on an earlier commit.

## Notes

- Local dev never needs Docker: `pnpm dev`.
- ESLint is not wired yet — CI runs typecheck + build only.
