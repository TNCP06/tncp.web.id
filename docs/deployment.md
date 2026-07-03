# Deployment

> Last verified against code: 2026-07-03 (Stage A scaffold — pipeline lands in Stage E)

## Model

Push to `main` → GitHub Actions builds & pushes the image to GHCR (tags `latest` + SHA) → SSH to the VPS → `docker compose pull && up -d && docker image prune -f`. The VPS never builds.

## GitHub Secrets (values NOT stored in the repo)

| Secret | Purpose |
|---|---|
| `DEPLOY_HOST` | VPS host |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | deploy private key (dedicated, not the owner's main key) |
| `DEPLOY_PATH` | app folder on the VPS |

Private GHCR: the VPS logs in once with a PAT scoped `read:packages`.

## First deploy / rollback / VPS ops

TODO (Stage E). Rollback = deploy a previous SHA tag.
