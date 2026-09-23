FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g pnpm@9.15.9

FROM base AS builder
WORKDIR /app
# Copy the entire monorepo
COPY . .
RUN pnpm install --no-frozen-lockfile
# Build the API and the workspace packages it depends on (permissions, shared-types).
RUN pnpm --filter @bharatsales/api... build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json

WORKDIR /app/server
EXPOSE 6002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:6002/health || exit 1

CMD ["node", "dist/main.js"]
