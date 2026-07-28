# syntax=docker/dockerfile:1

# Pin base image by tag *and* digest for reproducible, verifiable builds.
# node:24.18.0-alpine — Node.js 24 "Krypton" is the current Active LTS line.
ARG NODE_IMAGE=node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd

# ---------------------------------------------------------------------------
# Stage 1 — build
#
# The TypeScript compiler lives in devDependencies, so the build stage needs a
# full install. Keeping it in a separate stage means the toolchain never reaches
# the runtime image (smaller image, smaller attack surface).
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS builder

# Let corepack provision the pnpm version pinned in package.json#packageManager
# instead of hard-coding it a second time here.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /build

# pnpm-workspace.yaml carries the allowBuilds allow-list that pnpm 10+ requires
# before any dependency install script may run.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm run build

# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime

ARG VERSION=dev

LABEL org.opencontainers.image.title="CodeStats README" \
      org.opencontainers.image.description="GitHub Action for CodeStats metrics in README" \
      org.opencontainers.image.vendor="André Lademann" \
      org.opencontainers.image.source="https://github.com/vergissberlin/codestats-readme" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="$VERSION"

# Apply distro security updates and create an unprivileged account to run as.
RUN apk --no-cache upgrade && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app
RUN chown -R nodeuser:nodejs /app

USER nodeuser

# Runtime dependencies only — no compiler, no test tooling.
COPY --chown=nodeuser:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder --chown=nodeuser:nodejs /build/dist ./dist

# Verify the entrypoint is loadable rather than asserting a constant string.
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require.resolve('/app/dist/index.js')" || exit 1

CMD ["node", "dist/index.js"]
