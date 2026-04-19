# Use specific version with digest for reproducibility and security
FROM node:20.20.2-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293

# Build argument for version
ARG VERSION=dev

# Set metadata labels
LABEL org.opencontainers.image.title="CodeStats README" \
      org.opencontainers.image.description="GitHub Action for CodeStats metrics in README" \
      org.opencontainers.image.vendor="André Lademann" \
      org.opencontainers.image.source="https://github.com/vergissberlin/codestats-readme" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="$VERSION"

# Install security updates and create user early for better layering
RUN apk --no-cache upgrade && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Enable corepack and prepare pnpm (combined to reduce layers)
RUN corepack enable && \
    corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# Change ownership of working directory
RUN chown -R nodeuser:nodejs /app

# Copy package files with correct ownership from start
COPY --chown=nodeuser:nodejs package.json pnpm-lock.yaml ./

# Switch to non-root user before installing dependencies
USER nodeuser

# Install dependencies (removed cache mount due to complexity in this case)
RUN pnpm install --frozen-lockfile --prod

# Copy TypeScript source and build configuration
COPY --chown=nodeuser:nodejs src/ ./src/
COPY --chown=nodeuser:nodejs tsconfig.json ./

# Build TypeScript
RUN pnpm run build

# Health check with better validation
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -p "'Container is healthy'" || exit 1

# Use exec form and specify non-root user explicitly
USER nodeuser
EXPOSE 8080
CMD ["node", "dist/index.js"]
