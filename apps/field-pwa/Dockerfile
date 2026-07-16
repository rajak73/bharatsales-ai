# Build Stage
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bharatsales/field-pwa build

# Runner Stage (Nginx)
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/field-pwa/dist /usr/share/nginx/html
# Required for SPA routing (React Router)
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
