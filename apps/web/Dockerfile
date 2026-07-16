# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN turbo prune @bharatsales/web --docker

FROM node:22-alpine AS installer
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/out/json/ .
RUN pnpm install --no-frozen-lockfile
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=@bharatsales/web

# Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Next.js standalone output
COPY --from=installer /app/apps/web/next.config.js .
COPY --from=installer /app/apps/web/package.json .
COPY --from=installer /app/apps/web/public ./apps/web/public
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "apps/web/server.js"]
