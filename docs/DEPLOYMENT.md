# BharatSales AI: Deployment Guide

This guide deploys the whole system step by step. Every command and setting below matches the files in this repository (`render.yaml`, `client/vercel.json`, `apps/mobile/eas.json`, `apps/mobile/app.json`, `server/src/env.ts`).

| Part | Platform | Config in repo |
|------|----------|----------------|
| Database + uploaded photos | MongoDB Atlas (replica set, GridFS) | `MONGODB_URI` |
| API (`server`, Node.js + Express) | Render web service `bharatsales-ai` | `render.yaml` |
| Web dashboard (`client`, React + Vite) | Vercel | `client/vercel.json` |
| Field PWA (`apps/field-pwa`, optional) | Vercel | `apps/field-pwa/vercel.json` |
| Android app (`apps/mobile`, Expo) | EAS Build → GitHub release | `apps/mobile/eas.json`, `apps/mobile/app.json` |

Deploy in this order: **Atlas → Render → Vercel → update CORS on Render → Android**.

> The Android APKs already in the field, the field PWA and `eas.json` all call `https://bharatsales-ai.onrender.com`. Keep the Render service name, and so that URL, stable. Keep API routes and response shapes backward compatible.

---

## 0. Upgrading the existing production deployment

The project is already live, so this is an in-place upgrade, not a fresh setup:

| Piece | Current URL | What was running before | What changes |
|---|---|---|---|
| Web (Vercel) | https://bharatsales-ai-web.vercel.app | Next.js build calling `https://bharatsales-ai.onrender.com` | React + Vite build (`client/vercel.json`) |
| API (Render) | https://bharatsales-ai.onrender.com | NestJS | Express, same routes and response shapes |
| Android APK | GitHub release `v1.0.6-android` (build 7) | talks to the Render API | publish new builds with the `Release Android APK` workflow (it checks the signing key) |

Do these **before** merging the migration into `main` (Render and Vercel both auto-deploy `main`; a failed build keeps the previous version live):

1. **Render → Environment**
   - `CORS_ORIGINS=https://bharatsales-ai-web.vercel.app` (required — without it the production API denies the web dashboard's browser requests).
   - `JWT_SECRET` at least 32 characters (the API refuses to start in production otherwise).
   - `MONGODB_URI` with the **rotated** Atlas password (see step 1).
   - `STORAGE_DRIVER=gridfs` (default; keeps photos across deploys).
2. **Render → Settings → Build & Deploy** — the build must build the shared packages first and the start command must run `server/dist/main.js`:
   - Build: `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter @bharatsales/server... build`
   - Start: `node server/dist/main.js` (or `node dist/main.js` if the service's Root Directory is `server`)
3. **Vercel → Settings**
   - Root Directory: `client` (so `client/vercel.json` is used; it sets framework Vite, install/build commands and `dist` output).
   - Environment variables: add `VITE_API_URL=https://bharatsales-ai.onrender.com`; `NEXT_PUBLIC_API_URL` is no longer read and can be removed.
4. Open the pull request first: Vercel builds a preview URL for it. Log in on the preview (it calls the production API, which must already allow the preview origin — add it to `CORS_ORIGINS` temporarily, comma-separated) before merging.

## 1. MongoDB Atlas

1. **Cluster.** Create a cluster (the free M0 tier works). Every Atlas cluster is a replica set, which the API needs: order creation, dispatch, collections and offline sync use multi-document transactions.
2. **Database user.** Database Access → Add New Database User → password authentication. Generate a long random password and give the user **Read and write to any database**, or scope it to the `bharatsales` database only.
3. **Rotate the old password.** A MongoDB connection string, password included, was committed to this repository's git history in the past. Deleting it from the current files does not remove it from history. You must:
   - edit that database user and set a new password, or delete the user and create a new one;
   - update `MONGODB_URI` everywhere it is used (Render, and any local `.env`);
   - **never commit a connection string.** Only placeholders belong in `.env.example` files, and `.env` files are git-ignored.
4. **Network access.** Network Access → Add IP Address. Render's free plan has no fixed outbound IPs, so use `0.0.0.0/0` (allow from anywhere). The database password is then the only guard, so keep it strong. On paid Render plans you can allow-list Render's static outbound IPs instead. When you run a seed script from your own machine, your IP also needs access.
5. **Connection string.** Connect → Drivers:
   ```
   mongodb+srv://<user>:<password>@<cluster-host>/bharatsales?retryWrites=true&w=majority
   ```
   Put the database name (`bharatsales`) in the path. URL-encode special characters in the password.
6. **Backups.** Enable backups or snapshots if your tier supports them. Photos live in the same database (GridFS collections `uploads.files` and `uploads.chunks`), so a database backup covers them too.

---

## 2. API on Render

### 2.1 Create the service from the Blueprint

1. Render dashboard → **New → Blueprint** → connect the GitHub repo → select `render.yaml`.
2. Render reads the service definition:

   | Setting | Value (from `render.yaml`) |
   |---------|------------------------------|
   | Type / runtime | web service, `node` |
   | Name | `bharatsales-ai` |
   | Region / plan | `singapore` / `free` |
   | Branch | `main` (auto-deploy on push) |
   | Build command | `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter @bharatsales/server... build` |
   | Start command | `node server/dist/main.js` |
   | Health check path | `/health` |
   | Fixed env | `NODE_ENV=production`, `NODE_VERSION=22.23.1`, `TRUST_PROXY=1`, `STORAGE_DRIVER=gridfs` |

   The build installs the whole pnpm workspace. It then builds `@bharatsales/permissions` and `@bharatsales/shared-types`, and finally the API (`tsc -p tsconfig.build.json` → `server/dist`). `--prod=false` is required because `NODE_ENV=production` is also set at build time, and pnpm would otherwise skip the devDependencies (TypeScript) the build needs.
3. Render prompts for every `sync: false` variable. Fill them in as described in the next section, then **Apply**.

To create the service by hand instead: New → Web Service, root directory = repo root, and the same build command, start command, health check path and variables.

### 2.2 Environment variables

Checked against `server/src/env.ts` (validated at boot) and every `process.env` read in `server/src`:

| Variable | Set on Render? | Meaning |
|----------|---------------|---------|
| `NODE_ENV` | `production` (in Blueprint) | Turns on the production checks: `JWT_SECRET` length, required `MONGODB_URI`, fail-closed CORS, mock SSO disabled, seed guard. |
| `MONGODB_URI` | **required** | Atlas connection string from step 1. The API refuses to start in production without it. |
| `JWT_SECRET` | **required** | Signs the 15-minute HS256 access tokens. **At least 32 characters in production** or the API exits at boot with `CRITICAL: Invalid environment configuration`. Generate one with `openssl rand -base64 48`. Changing it logs everyone out once. |
| `JWT_REFRESH_SECRET` | optional | Declared optional in `env.ts` and **not used by the running API**. Refresh tokens are opaque random values stored hashed in the `sessions` collection. `render.yaml` still lists it for older configs, so any random value (or leaving it empty) is fine. |
| `CORS_ORIGINS` | **required** | Comma-separated browser origins allowed to call the API: the exact Vercel URL(s), scheme included, with no trailing slash, e.g. `https://bharatsales-web.vercel.app,https://bharatsales-pwa.vercel.app`. **If unset in production, every cross-origin browser request is denied.** Requests without an `Origin` header (the Android app, curl) are always allowed. |
| `FRONTEND_URL` | **required in practice** | Public URL of the web dashboard, used in email-verification, password-reset and invitation links. Not validated at boot. If unset, the links point to `http://localhost:6003`. |
| `STORAGE_DRIVER` | `gridfs` (in Blueprint) | Where uploaded photos go. `gridfs` stores them in MongoDB, where they survive deploys; this is also the default. `local` writes to `server/uploads`, which Render wipes on every deploy. |
| `TRUST_PROXY` | `1` (in Blueprint) | Express `trust proxy` setting: a hop count, `true`/`false`, or a proxy list. Default `1`. Render puts one proxy in front of the service. A wrong value lets clients spoof `X-Forwarded-For`, which breaks rate limits and audit IPs. |
| `BREVO_API_KEY` | optional | Brevo transactional email (verification, reset, invitations), SMS and WhatsApp (`POST /notifications/sms`, `/notifications/whatsapp`). Without it, emails are logged and skipped. |
| `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | optional | Sender for Brevo emails. The sender must be verified in Brevo. |
| `BREVO_SMS_SENDER` | optional | SMS sender id (default `BharatAI`). |
| `PORT` | leave unset | Render injects it. The default is 6002. |
| `ALLOW_PROD_SEED` | **do not set on the service** | Read only by the seed scripts, never by the running API. Use it only on your own shell for a one-off admin bootstrap (step 6). |
| `MOCK_SSO_ENABLED` | **do not set** | Mounts mock Google/Microsoft SSO endpoints. It is ignored whenever `NODE_ENV=production`. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | no effect | Read, but SMS sending is not implemented: OTP SMS is never sent (OTPs also go by email). |

### 2.3 Verify

After the first deploy finishes:

```bash
curl https://bharatsales-ai.onrender.com/health
# 200 {"status":"ok","info":{"mongodb":{"status":"up"}},...}   (503 when MongoDB is unreachable)
curl https://bharatsales-ai.onrender.com/api/v1/health/live
# 200 {"status":"ok","timestamp":"..."}
```

If the deploy fails, open Logs:

- `CRITICAL: Invalid environment configuration` lists each bad variable.
- `MongooseServerSelectionError` means a network access or credentials problem in Atlas.

The free plan sleeps after about 15 minutes idle. The first request after that can take up to a minute; the API client uses a 60-second timeout.

---

## 3. Web dashboard on Vercel

1. Vercel → **Add New → Project** → import the GitHub repo.
2. **Root Directory: `client`**. Framework preset: **Vite**. `client/vercel.json` overrides the rest, so leave the dashboard fields at their defaults:

   | Setting | Value (from `client/vercel.json`) |
   |---------|--------------------------------------|
   | Framework | `vite` |
   | Install command | `cd ../.. && pnpm install --frozen-lockfile` (whole workspace) |
   | Build command | `cd ../.. && pnpm --filter "@bharatsales/client..." build` (builds workspace deps, then `tsc --noEmit && vite build`) |
   | Output directory | `dist` (that is, `client/dist`) |
   | Rewrites | `/(.*)` → `/index.html` (client-side routing) |

   Vercel's project settings must allow files outside the root directory (the default), because the build needs `packages/*`.
3. **Environment variables** (Production and Preview):

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://bharatsales-ai.onrender.com`: the API root, **without** `/api/v1` |
   | `VITE_FIELD_PWA_URL` | optional: URL of the field PWA, used by the "Field PWA" sidebar link for sales reps (defaults to `http://localhost:6001`) |
   | `VITE_WHATSAPP_NUMBER` | optional: digits with country code (e.g. `919000012345`) for the floating WhatsApp button on the public site. Hidden when empty. |
   | `VITE_CONTACT_EMAIL` | optional: contact email shown on the public site |

   `VITE_*` values are inlined into the JavaScript at build time and are public. Put no secrets in them, and **redeploy** after changing them.
4. Deploy. Then go back to Render and set **`CORS_ORIGINS`** and **`FRONTEND_URL`** to the Vercel production URL. Saving on Render redeploys the API.

**Field PWA (optional):** same steps with Root Directory `apps/field-pwa`. Its `vercel.json` only adds the SPA rewrite, so set the framework to Vite and output `dist`. `VITE_API_URL` defaults to the Render URL through `apps/field-pwa/.env.production` and `vite.config.ts`. Add its URL to `CORS_ORIGINS` as well.

---

## 4. Point the Android build at the API

`apps/mobile/eas.json` sets `EXPO_PUBLIC_API_URL=https://bharatsales-ai.onrender.com` for both the `preview` and `production` profiles. If your Render URL differs, change it there. The value is inlined into the APK at build time.

---

## 5. Android APK (EAS)

Prerequisites: an [Expo account](https://expo.dev) with access to the EAS project in `app.json` (`extra.eas.projectId`), and `eas-cli` 12 or later (`eas.json` requires `>= 12.0.0`).

```bash
cd apps/mobile

# 1. Bump the version. eas.json has "appVersionSource": "local", so the
#    numbers in app.json are used as-is (the preview profile does not auto-increment).
#    - android.versionCode: +1 on every build you distribute (currently 6)
#    - expo.version: user-visible version, e.g. 1.0.4 -> 1.0.5

# 2. Log in and build an installable APK
npx eas-cli login
npx eas-cli build -p android --profile preview
#    preview = distribution "internal", android.buildType "apk"
#    (the production profile builds an .aab for the Play Store instead)

# 3. When the build finishes, download the .apk from the build page (the CLI prints the URL)
```

On the EAS server, the `eas-build-post-install` script in `apps/mobile/package.json` builds `shared-types`, `permissions` and `api-client` before bundling.

**Publish it as a GitHub release** (name the file like the existing ones):

```bash
gh release create v1.0.5-android ./BharatSales-AI-v1.0.5.apk \
  --title "BharatSales AI Android v1.0.5" \
  --notes "versionCode 6. <what changed>"
```

Then update the download link in `README.md`. The current published build is [v1.0.6 (build 7)](https://github.com/rajak73/bharatsales-ai/releases/download/v1.0.6-android/BharatSales-AI-v1.0.6.apk).

Android will not install an APK over an existing install with a lower or equal `versionCode`, or one signed with a different key. Always build with the same EAS project and credentials.

---

## 6. Create the first platform admin

Never run the demo seed (`pnpm --filter @bharatsales/server seed`) against production. It **deletes** the data in the target collections and creates demo accounts that all share the password `password123`. Its only safety guard is `NODE_ENV=production`.

Create the real platform operator with `seed:platform-admin` instead. It upserts one user by email (`role: Super Admin`, `platformAdmin: true`) and touches nothing else. Run it once from your own machine; your IP must be allowed in Atlas:

```bash
cd server
NODE_ENV=production ALLOW_PROD_SEED=true \
MONGODB_URI='<atlas-uri>' \
PLATFORM_ADMIN_EMAIL='ops@yourcompany.com' \
PLATFORM_ADMIN_PASSWORD='<long random password>' \
pnpm run seed:platform-admin
```

- The seed scripts do **not** load `server/.env`. They read only the variables on the command line or in your shell.
- The script prints `Connected to MongoDB: <uri>`, **including the password**. Run it in a private terminal, not in shared CI logs, and clear your shell history afterwards (the password is also on the command line).
- Use a lowercase email. The password is not checked against the app's password policy, so choose a strong one yourself.
- Log in to the web dashboard as this user. Tenant (company) admins are then created from the product: the Super Admin console creates a tenant together with its admin user (`POST /superadmin/tenants`), or a company signs up (`/auth/register`) and the platform admin activates it. Company admins invite their own users.

---

## 7. Post-deploy checklist

- [ ] `GET https://bharatsales-ai.onrender.com/health` returns 200 with `mongodb: up`.
- [ ] Render logs show `BharatSales AI API running on port ...` and `Scheduled 3 jobs (Asia/Kolkata)`, with no CORS error line (`CORS_ORIGINS is not set in production`).
- [ ] The web dashboard loads on the Vercel URL, and the browser dev tools show API calls going to the Render URL with no CORS errors.
- [ ] Log in once per role and check the landing page and one core screen:
  - [ ] Super Admin (platform admin): tenants console
  - [ ] Organization Admin: users, products, outlets, orders
  - [ ] Sales Manager: team, approvals, live map
  - [ ] Sales Representative: the Android app (start day, check in to an outlet, place an order)
  - [ ] Distributor: orders, inventory, dispatch
- [ ] Photo upload: check in to a visit with a photo (or take an attendance selfie) in the Android app. The upload returns `{ url: "/uploads/<name>" }`, and `GET https://bharatsales-ai.onrender.com/uploads/<name>` returns the image. It is stored in GridFS, so it must still load after the next deploy.
- [ ] Password-reset email arrives (if Brevo is configured) and its link opens the Vercel URL (`FRONTEND_URL`).
- [ ] Offline sync: in airplane mode, queue an order in the app, reconnect, and confirm it syncs exactly once.
- [ ] **No demo accounts on production.** Search the `users` collection for `@bharatfoods.com`, `@rajpharma.com`, `@saketdist.com` and `superadmin@bharatsales.com`. If any exist (for example because the demo seed was ever run here), delete them or change their passwords now. Change any password that was ever shared in chat or docs.
- [ ] The MongoDB password has been rotated since the leaked commit (step 1.3), and no secret appears in `git grep -n "mongodb+srv://"`.
- [ ] `MOCK_SSO_ENABLED` and `ALLOW_PROD_SEED` are not set on Render.

---

## 8. CI and rollback

- `.github/workflows/ci.yml` runs on every push and pull request to `main`: type-check, lint, seed smoke test, tests and build for all workspaces against a throwaway MongoDB replica set, plus a separate `client` Vite build. **CI does not deploy.** Render and Vercel deploy from `main` on their own.
- **Render rollback:** Events → pick an earlier successful deploy → Rollback.
- **Vercel rollback:** Deployments → earlier deployment → Promote to Production.
- There is no schema migration step. If a release changed stored data, restore from an Atlas backup (see [RUNBOOK.md](RUNBOOK.md)).

## 9. Self-hosting (optional)

`infra/aws/docker-compose.prod.yml` runs MongoDB (replica set), the API and the web build on a single server behind the host nginx (`infra/aws/nginx/nginx.conf`). `infra/aws/setup.sh` installs Docker on Ubuntu, and `infra/aws/setup_ssl.sh` installs nginx and Certbot. The compose file refuses to start without `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS` and `VITE_API_URL`. Export them, plus `FRONTEND_URL`, before running `docker compose -f infra/aws/docker-compose.prod.yml up -d --build`.
