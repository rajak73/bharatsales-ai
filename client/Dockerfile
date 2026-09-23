# Build Stage — Vite production build of the React SPA
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g pnpm@9.15.9

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Vite inlines VITE_* variables at build time.
ARG VITE_API_URL
ARG VITE_FIELD_PWA_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FIELD_PWA_URL=$VITE_FIELD_PWA_URL
RUN pnpm --filter @bharatsales/client build

# Runner Stage — static files served by nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/client/dist /usr/share/nginx/html
# SPA fallback so client-side routes (/dashboard/...) resolve to index.html;
# hashed assets are cached long-term, index.html never.
RUN printf '%s\n' \
  'server {' \
  '  listen 3000;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; try_files $uri =404; }' \
  '  location / { add_header Cache-Control "no-cache"; try_files $uri $uri/ /index.html; }' \
  '}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
