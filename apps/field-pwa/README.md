# BharatSales AI: Field PWA

An offline-first progressive web app for **Sales Representatives**, built with React 19, Vite and vite-plugin-pwa (service worker `src/sw.ts`). It covers the rep's day: attendance, beat, outlet visits with photos, cart and orders, and collections. Offline writes go to a Dexie (IndexedDB) queue and sync with retry and backoff (see [docs/OFFLINE_SYNC.md](../../docs/OFFLINE_SYNC.md)).

The Android app (`apps/mobile`) implements the same rep workflows natively. See [docs/KNOWN_LIMITATIONS.md](../../docs/KNOWN_LIMITATIONS.md).

## Run locally

```bash
# from the repo root, after `pnpm install` and building the shared packages
cp apps/field-pwa/.env.example apps/field-pwa/.env.local   # VITE_API_URL=http://localhost:6002
pnpm --filter @bharatsales/field-pwa dev                   # http://localhost:6001
```

| Script | Does |
|--------|------|
| `dev` | Vite dev server on port 6001 (service worker enabled in dev) |
| `build` | `tsc -b && vite build` → `dist/` |
| `preview` | serves `dist/` on port 6001 |
| `lint` | oxlint |

## Layout

- `src/screens/`: pages (outlets, visit, cart, collection, and so on)
- `src/database/db.ts`: Dexie schema (cached reference data and `syncQueue`)
- `src/sync/`: sync engine, retry policy and queue ownership
- `src/contexts/`: auth, attendance and cart state

## Deploy

On Vercel, set Root Directory to `apps/field-pwa`, the framework to Vite and the output to `dist`. `vercel.json` adds the SPA rewrite. Production builds take `VITE_API_URL` from `.env.production` (`https://bharatsales-ai.onrender.com`). Add the deployed URL to `CORS_ORIGINS` on the API. Details are in [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md).

Capacitor is configured (`capacitor.config.ts`), but no native Android project is checked in.
