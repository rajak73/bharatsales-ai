# Render + Vercel deployment

This guide has been merged into **[DEPLOYMENT.md](DEPLOYMENT.md)**, which has the step-by-step instructions for Atlas, Render, Vercel, Android and the post-deploy checklist.

Quick reference:

- **Render (API):** Blueprint `render.yaml`. Build `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter @bharatsales/api... build`, start `node apps/api/dist/main.js`, health check `/health`.
  - Required env: `MONGODB_URI`, `JWT_SECRET` (32+ characters), `CORS_ORIGINS` (the Vercel URL), `FRONTEND_URL`.
  - Set by the Blueprint: `STORAGE_DRIVER=gridfs`, `TRUST_PROXY=1`.
  - `JWT_REFRESH_SECRET` is optional and unused.
- **Vercel (web):** Root Directory `apps/web`, framework **Vite**, output `dist` (`apps/web/vercel.json`). Env: `VITE_API_URL=https://bharatsales-ai.onrender.com` (no `/api/v1`). The old `NEXT_PUBLIC_*` variables are no longer used.
