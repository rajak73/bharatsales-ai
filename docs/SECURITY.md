# BharatSales AI - Security

This describes what the API (`apps/api`, Node.js + Express) actually enforces today. File references are relative to `apps/api/src`.

## Authentication

- **Passwords** are hashed with bcrypt (cost 10). Policy (`core/validation.ts`): 8-128 characters with at least one letter and one digit, applied to register, reset, invitation acceptance and user creation.
- **Access tokens:** HS256 JWT signed with `JWT_SECRET`, valid for 15 minutes, sent as `Authorization: Bearer <token>`. `core/auth.middleware.ts` `authenticate` verifies them and pins the algorithm to HS256.
- **Refresh tokens:** 40 random bytes, stored only as a SHA-256 hash in the `sessions` collection, valid for 7 days, rotated on every `POST /auth/refresh`. Presenting an already-rotated token revokes the whole session and writes a `REFRESH_TOKEN_REUSE` audit entry. Logout revokes the session.
- **Account lockout:** 5 consecutive wrong passwords or OTPs lock the account for 15 minutes. Login, refresh and OTP also refuse inactive users, unverified emails and suspended / archived / pending organisations.
- **Email verification, password reset and invitations** use single-use random tokens (32 bytes) delivered by email. The links point at `FRONTEND_URL`.
- **Mock SSO** endpoints (`/auth/sso/*`) exist only when `MOCK_SSO_ENABLED=true` and `NODE_ENV` is not `production`; otherwise they are 404.
- **Mobile** stores tokens in the OS keystore (Expo SecureStore).

## Authorization (RBAC and tenant isolation)

- The role and permission matrix lives in `packages/permissions` (five roles: Super Admin, Organization Admin, Sales Manager, Sales Representative, Distributor) and is enforced by the API. Super Admin is deliberately denied tenant operational data in the matrix. Platform endpoints (`/superadmin/*`) are gated by `requirePlatformAdmin` instead. Routes declare `requirePermission(Resource, Action)`, `requireRoles(...)` or `requirePlatformAdmin`. A missing permission returns 403.
- **Tenant isolation:** the organisation is always `req.user.orgId` from the verified JWT. Client-supplied organisation ids are ignored and every query is filtered by `organizationId`.
- **Hierarchy scope:** managers only see their own subtree (`hierarchy/team-scope.ts`).
- **Mass assignment:** `validateBody` (Zod) strips unknown keys, so clients cannot set fields such as `role`, `platformAdmin`, `status` or `outstandingBalance` unless a route explicitly accepts them. `platformAdmin` cannot be set through any API body.

## Input validation and hardening

- Zod schemas on request bodies and queries (`core/http.ts`). Validation failures return 400 with a list of problems.
- `core/sanitize.middleware.ts` removes `$`-prefixed and dotted keys from body, query and params (MongoDB operator injection).
- JSON and urlencoded bodies are limited to 2 MB. Uploads are limited to one file of 5 MB. The image type is detected from its magic bytes (JPEG / PNG / WebP only, `uploads/image-type.ts`) and stored under a server-generated name, never the client's filename.
- `helmet` security headers, `x-powered-by` disabled.
- **CORS:** allow-list from `CORS_ORIGINS`. In production an empty list denies every browser cross-origin request (fail closed). Requests without an `Origin` header (the mobile app, server-to-server) are allowed because CORS does not apply to them.
- **Errors** (`core/error-handler.ts`) use one `{ statusCode, message, error }` shape. Unexpected errors return a generic 500 message; stack traces are only logged server-side.

## Rate limits (`core/rate-limit.ts`)

| Scope | Limit |
|-------|-------|
| `POST /auth/login` | 20 / 15 min per IP + email |
| `POST /auth/otp/request`, `/auth/otp/verify` | 10 / 15 min per IP + email |
| `POST /auth/forgot-password` | 10 / 15 min per IP + email |
| `POST /auth/reset-password`, `/auth/register` | 20 / 15 min per IP |
| Credential endpoints combined | 300 / 15 min per IP |
| `POST /auth/refresh` | 5000 / 15 min per IP |
| Everything (global) | 1200 / min per authenticated user, 3000 / min per anonymous IP |

Limits key on `req.ip`, so `TRUST_PROXY` must match the real number of proxies in front of the API (Render: 1). Otherwise clients can spoof `X-Forwarded-For`, or everyone shares the proxy's IP. Exceeded limits return 429.

## Audit logging

`core/audit.middleware.ts` records successful POST / PUT / PATCH / DELETE requests on audited routes (organisation, actor, role, action, entity, IP, user agent, reason). Keys that look like secrets (`password`, `token`, `secret`, `otp`, `pin`, `apiKey`, ...) are redacted before storage. Auth events (login, refresh-token reuse) are audited by the auth service.

## Secrets handling

- Secrets come only from environment variables and are validated at boot (`env.ts`). The API **refuses to start** if `JWT_SECRET` is missing, if it is shorter than 32 characters in production, or if `MONGODB_URI` is missing in production.
- There are no secret fallbacks in code. `.env` files are git-ignored; `.env.example` files contain placeholders only.
- Production secrets live in the Render / Vercel dashboards (`render.yaml` marks them `sync: false`). CI uses throwaway test secrets.
- Rotate `JWT_SECRET` (this logs everyone out once) and the MongoDB Atlas password whenever they may have been exposed, for example after being pasted into chat, committed, or shared.
- **Known exposure:** a MongoDB Atlas connection string with its password was committed to this repository's git history. Removing it from current files does not remove it from history, so that database user's password must be rotated (see [DEPLOYMENT.md](DEPLOYMENT.md#1-mongodb-atlas)). Never commit connection strings.
- The seed scripts print `Connected to MongoDB: <uri>`, password included. Run them only in a private terminal, never in shared CI logs, against a production URI.
- **Demo accounts** are created only by the local seed (`pnpm --filter @bharatsales/api seed`) with a shared demo password. The seed refuses `NODE_ENV=production` unless `ALLOW_PROD_SEED=true`. Demo accounts must never exist on production: create real admins with `seed:platform-admin` and a strong `PLATFORM_ADMIN_PASSWORD`.

## Required production environment

| Variable | Why |
|----------|-----|
| `NODE_ENV=production` | Enables the production checks: fail-closed CORS, no mock SSO, seed guard, secret length check |
| `MONGODB_URI` | Atlas replica set; the API will not start without it |
| `JWT_SECRET` | 32+ random characters; the API will not start otherwise |
| `JWT_REFRESH_SECRET` | Random value (reserved; refresh tokens are opaque) |
| `CORS_ORIGINS` | Exact web / PWA origins; unset = browsers are blocked |
| `FRONTEND_URL` | Target of email links; wrong value = broken reset links |
| `TRUST_PROXY` | `1` on Render; correct client IPs for rate limits and audit |
| `STORAGE_DRIVER=gridfs` | Photos persist across deploys |

Must **not** be set in production: `MOCK_SSO_ENABLED`, `ALLOW_PROD_SEED` (except for one-off admin bootstrap from a workstation).

## Supply chain and CI

- `pnpm install --frozen-lockfile` in CI and on Render/Vercel.
- Dependabot: weekly npm updates (grouped minor/patch) and monthly GitHub Actions updates.
- CodeQL (`security-extended`) scans JavaScript/TypeScript on every push, pull request and weekly.

## Reporting a vulnerability

Do not open a public issue. Contact the repository owner privately with steps to reproduce.

## Known gaps

- No per-tenant rate limits or CAPTCHA on public forms.
- Access tokens stay valid for up to 15 minutes after logout or deactivation (no deny-list).
- No Content-Security-Policy on the API (it serves JSON). The web app's CSP is up to the host (Vercel).
- Uploaded photos are served without authentication to anyone who knows the (random, 128-bit) file name.
- The demo seed's only production guard is `NODE_ENV=production`. Run with a production `MONGODB_URI` but without that variable, it would wipe the production data.
- SMS OTP delivery is not implemented. OTPs go only by email, and the Twilio variables have no effect.
