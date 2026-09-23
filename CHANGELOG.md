# Changelog

## Unreleased: migration to Node.js + Express, React + Vite, MongoDB

Branch `migrate/express-react`, compared with `main` (c2abc0e). `git diff --stat main` for tracked files shows 419 files changed, 9,920 insertions and 26,149 deletions. That count excludes the new untracked files: the Express routers, the `core/` middleware and the React pages.

The project was moved to the required stack: **Node.js + Express** backend, **React.js** frontend, **MongoDB** database. The HTTP API contract (paths and response shapes) was kept compatible, so the Android APKs already installed keep working.

### Backend: NestJS → plain Express (`server`)
- Removed NestJS and every `@nestjs/*` package (core, mongoose, jwt, schedule, terminus, throttler, swagger with `/api/docs`, bull), along with Bull/Redis and the `openai` dependency.
- Added one Express router per domain (`src/<domain>/<domain>.routes.ts`), explicit dependency wiring (`container.ts`, `models.ts`), `app.ts` for middleware and mounting, and `main.ts` for boot and graceful shutdown. The services and Mongoose schemas were kept.
- Added `core/` middleware: `authenticate`, `requirePermission`, `requireRoles`, `requirePlatformAdmin`, Zod `validateBody` / `validateQuery`, a central error handler (`{ statusCode, message, error }`), an audit middleware and rate limiters.
- `env.ts` validates the environment at boot with Zod. The API refuses to start if `JWT_SECRET` is missing, if it is under 32 characters in production, or if `MONGODB_URI` is missing in production. `JWT_REFRESH_SECRET` became optional and unused.
- `scheduler.ts` (node-cron, Asia/Kolkata) replaces `@nestjs/schedule`: inventory reservation cleanup every 15 minutes, plus target roll-up and missed-outlet notifications at midnight.
- The health checks `/health` (MongoDB ping, used by Render) and `/api/v1/health/live` and `/ready` replace `@nestjs/terminus`.
- Tests: Jest + Supertest specs run against an in-memory MongoDB replica set (mongodb-memory-server) or `MONGODB_URI` in CI. MongoDB's transaction lock timeout was raised in tests and CI to stop flaky failures.

### Uploads: local disk → MongoDB GridFS
- `STORAGE_DRIVER=gridfs` (the default) stores visit photos and selfies in the GridFS bucket `uploads`, so they survive Render deploys. `local` remains for development.
- Uploads are validated by content (magic bytes: JPEG, PNG or WebP, up to 5 MB) instead of the client's MIME type, and stored under a server-generated 128-bit random name instead of the client's filename.
- `GET /uploads/:name` streams from GridFS and falls back to legacy disk files, with `nosniff` and sandboxing CSP headers.

### Security fixes
- **CORS:** the reflect-any-origin setting was replaced by the `CORS_ORIGINS` allow-list, which **fails closed in production** when unset.
- `sanitizeInput` strips `$`-prefixed and dotted keys from body, query and params (NoSQL operator injection).
- Rate limits were re-implemented with express-rate-limit, replacing `@nestjs/throttler`, which had no working global limit. There are separate limiters for login, OTP, forgot and reset password, register and refresh (keyed by IP + email where there is an email), a combined per-IP ceiling, and a global per-user / per-IP limit. `TRUST_PROXY` keeps client IPs correct behind Render.
- Refresh tokens are stored only as SHA-256 hashes and rotated on every use. Reusing a rotated token revokes the session and is audited (`REFRESH_TOKEN_REUSE`).
- Audit logs redact secret-like keys (password, token, secret, otp, pin, apiKey, ...) before storage.
- RBAC from `packages/permissions` is enforced by `requirePermission`, and platform routes by `requirePlatformAdmin`. Zod strips unknown keys, so `platformAdmin`, `role`, `status` and similar fields cannot be mass-assigned.
- Mock SSO is available only with `MOCK_SSO_ENABLED=true` outside production. The seed scripts refuse `NODE_ENV=production` without `ALLOW_PROD_SEED=true`.
- CodeQL (`security-extended`) and Dependabot were added.

### Web: Next.js → React 18 + Vite (`client`)
- Replaced the Next.js App Router (`src/app/**`) with a Vite SPA: react-router 6 and `React.lazy` pages under `src/pages/**`, a `RequireRole` route guard and `CurrentUserContext`.
- `NEXT_PUBLIC_*` variables were replaced by `VITE_API_URL`, `VITE_FIELD_PWA_URL`, `VITE_WHATSAPP_NUMBER` and `VITE_CONTACT_EMAIL`.
- Deployed on Vercel with framework Vite (`client/vercel.json`), with an SPA rewrite to `index.html`.

### Design system and theme (`packages/ui`)
- New shared design tokens and components (button, card, input and more) in `packages/ui`, with `packages/ui/tailwind.config.js` as the Tailwind preset.
- "Navy + Saffron" theme: navy `#0B1F44` for the frame, blue `#1B4FD8` for primary actions, and saffron `#FF8A1F` for one accent CTA per view. The dense dashboard layout is documented in `client/UI_GUIDE.md`. The mobile app mirrors the palette in `apps/mobile/src/theme/tokens.ts`.

### Mobile (`apps/mobile`, Expo) and field PWA sync fixes
- The offline queue now has an `attempts` / `nextAttemptAt` schedule with exponential backoff (5 s doubling, capped at 30 min, at most 8 attempts). Errors are classified as transient (network, 5xx, 408, 429: retried) or permanent (other 4xx: marked failed and shown with Retry / Discard).
- Queue items are stamped with the owning user and sent only with that user's session, so no one submits another user's queued orders or payments on a shared device.
- Sync triggers: besides the existing on-reconnect trigger, sync now also runs on enqueue, on app foreground, every 2 minutes in the foreground, and when a backed-off item comes due.
- Earlier fixes on `main` also ship in this build: a request timeout, real backend error messages on login, reactive navigation after login, and tolerance of SecureStore failures.
- `android.versionCode` bumped to 6. This build has not been published yet; the latest APK is v1.0.4 (build 5).

- Sales Representatives can now record payment collections (`Collections: create` in `packages/permissions`). Before this, `POST /collections` returned 403 for reps, so payments queued in the Android app / field PWA failed to sync. The collector is set server-side to the logged-in rep.

### Deployment and docs
- `render.yaml` Blueprint for the API: Singapore region, health check `/health`, `STORAGE_DRIVER=gridfs`, `TRUST_PROXY=1`, and secrets marked `sync: false`. The old deploy workflows were removed; CI (`ci.yml`) only verifies.
- Docs rewritten for the new stack: README, DEPLOYMENT, ARCHITECTURE, SECURITY, API_CONTRACT, OFFLINE_SYNC, PERMISSION_MATRIX, KNOWN_LIMITATIONS and RUNBOOK, plus `.env.example` files for every app. Outdated status and context files were removed.

### Action required
- **Rotate the MongoDB Atlas password.** A connection string was committed to git history in the past (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#1-mongodb-atlas)).
- Make sure no demo seed accounts exist on production.
