# syntax=docker/dockerfile:1

# ── Base: Node + pnpm (Debian slim — safest for sharp + libsql native) ──
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ── Full deps (for the build) ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ── Build ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Config init needs these; values are irrelevant to the build output.
ENV PAYLOAD_SECRET=build-time-placeholder
ENV DATABASE_URI=file:/tmp/build.db
RUN pnpm --filter web build

# ── Prod deps only (smaller runtime; installs the linux libsql/sharp binaries) ──
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

# ── Runtime ──
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Data dir (SQLite + media) — a volume is mounted here in compose.
RUN mkdir -p /data/media && chown -R node:node /data

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY apps/web/package.json apps/web/next.config.ts ./apps/web/
COPY package.json pnpm-workspace.yaml ./

USER node
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
