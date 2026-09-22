# BharatSales AI: Known Limitations

This lists the current, verifiable limitations of the code on this branch. Each item names where to look. Keep it honest: remove an item only when the code fixes it.

## Product and features

- **Two rep apps with duplicated functionality.** The Android app (`apps/mobile`, Expo) and the field PWA (`apps/field-pwa`, React + Vite) implement the same rep workflows separately: beats, visits, attendance, orders and the offline queue. The mobile code is a port of the PWA's. Fixes have to be made twice, and the two can drift. The PWA uses React 19 and react-router 7, while the web dashboard uses React 18 and react-router 6.
- **Roles are coarse.** There are five roles. Finance, auditor and read-only viewer are not separate roles, and there are no field-level permissions ([PERMISSION_MATRIX.md](PERMISSION_MATRIX.md)).
- **No AI or ML features.** Despite the product name, no AI model or external AI provider is integrated.
- **SSO is mock only.** `/auth/sso/google` and `/auth/sso/microsoft` are mocks that are only mounted with `MOCK_SSO_ENABLED=true` outside production. No real OAuth integration exists.
- **SMS OTP is not implemented.** `TwilioSMSProvider` logs "NOT sent" even when Twilio credentials are set. OTPs are delivered by email only (Brevo).
- **Email, SMS and WhatsApp need Brevo.** Without `BREVO_API_KEY`, emails and notifications are only logged. WhatsApp sending also needs an approved Brevo WhatsApp sender and templates.
- **Unused shared packages.** `packages/business-rules`, `validation`, `config` and `i18n` are not imported by any app. There is no Hindi or other translation in the UIs.
- **No pagination.** List endpoints return full arrays scoped to the caller. This is fine at demo scale but will not scale to very large tenants.

## Mobile (Android)

- **Push notifications do not work end-to-end.** The app gets an Expo push token (`src/lib/registerPushNotifications.ts`) and the API stores it (`POST /auth/push-token`), but **the API never sends a push**: there is no Expo or FCM push call anywhere in `apps/api`. Standalone Android builds also need Firebase Cloud Messaging (FCM) credentials configured in EAS (a `google-services.json` / FCM v1 key), and none are set up (`app.json` has no `googleServicesFile`). In-app notifications (`GET /notifications`) work.
- **No iOS build.** `app.json` has an iOS bundle id and permission strings, but no iOS build has been configured, signed or tested (no Apple credentials, no iOS-specific `eas.json` settings). Only Android APKs are distributed.
- **No background location.** `ACCESS_BACKGROUND_LOCATION` is blocked in `app.json`. Location pings for the live map are recorded only while the app is open during a working day.
- **Manual versioning.** `eas.json` uses `appVersionSource: "local"`, so `android.versionCode` in `app.json` must be bumped by hand before each distributed build. The code is at versionCode 6, while the latest published APK is v1.0.4 (build 5).
- **APK distribution is sideloading.** Users must allow "Install unknown apps". There is no Play Store listing.
- **The installed APK pins the API contract.** Shipped APKs call `https://bharatsales-ai.onrender.com` with fixed paths, so API routes and response shapes cannot change incompatibly.

## Field PWA

- **Capacitor is configured but unused.** `capacitor.config.ts` and `@capacitor/android` are present, but no `android/` native project is checked in.
- Needs a browser with service-worker and IndexedDB support. Tokens are kept in `localStorage`.

## Web dashboard

- **The live map polls.** `pages/dashboard/live-map` polls `GET /live-map/reps` every 5 seconds, skipping ticks while the tab is hidden, because a browser `EventSource` cannot send the Bearer token. The SSE endpoint `GET /live-map/stream` exists but is unused. Positions are only as fresh as the reps' last pings.
- **No unit tests** for `apps/web`. It is covered only by type-check, lint and the Playwright E2E suite in `e2e/`, which needs local servers and a seeded database.

## API and infrastructure

- **Render free plan:** the service sleeps after about 15 minutes idle, and the first request can take up to a minute. It runs a single instance. The cron jobs (`scheduler.ts`) run inside the API process, so scaling to several instances would run each job once per instance.
- **Batch sync endpoints are unused.** `GET /sync/pull` and `POST /sync/push` exist and are tested, but both field clients replay their queues through the regular endpoints ([OFFLINE_SYNC.md](OFFLINE_SYNC.md)).
- **Offline conflicts are not resolved interactively.** A rejected queued item becomes "failed" with the server's message, and the user can only retry or discard it.
- **Access tokens are not revocable.** An access token stays valid for up to 15 minutes after logout or deactivation, because there is no deny-list.
- **Uploaded photos are public by URL.** `GET /uploads/<name>` needs no auth, and the 128-bit random name is the only protection.
- **The seed guard is weak.** The demo seed deletes data and is blocked only when `NODE_ENV=production`. Running it with a production `MONGODB_URI` but without `NODE_ENV=production` would wipe production. The seed scripts also print the connection URI, password included.
- **No migrations framework.** Schema changes rely on Mongoose defaults. Restoring data means an Atlas backup.
- **Leftover config.** `packages/api-client` still checks `NEXT_PUBLIC_API_URL` first (from the old Next.js app). Nothing sets it today. `JWT_REFRESH_SECRET` is accepted but unused.
- **No load testing, APM, log aggregation or alerting.** Monitoring is limited to the Render health check (`/health`) and Render logs.
