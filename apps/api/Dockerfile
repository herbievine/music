# Multi-stage build for the Hono/Drizzle API (@music/api).
# Built from the REPO ROOT context. The api imports workspace packages
# (@music/db, @music/haxel), so the whole workspace must be present to install
# and resolve. Mirrors the metallica api Dockerfile.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@8.15.6 --activate
# Toolchain in case a native dep (e.g. pg build tools) compiles from source.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @music/api build
# Self-contained prod deploy (flattened node_modules, prod deps only) at /app.
RUN pnpm --filter @music/api deploy --prod /app

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
# `pnpm deploy` carries node_modules but not the gitignored build output.
COPY --from=build /repo/apps/api/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
