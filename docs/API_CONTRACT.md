# BharatSales AI: API Contract

This is the REST API served by `apps/api` (Node.js + Express). The route list below is generated from the `router.<method>('<path>')` calls in `apps/api/src/**/*.routes.ts` and the mount paths in `apps/api/src/app.ts`. When they disagree, the code wins.

## Base URL

- Production: `https://bharatsales-ai.onrender.com`
- Local: `http://localhost:6002`

Paths are **not** under a common prefix. Most routers are mounted at the root (`/orders`, `/outlets`, ...), and three groups live under `/api/v1` (`/api/v1/finance`, `/api/v1/performance`, `/api/v1/health/*`). This layout is kept for backward compatibility with the Android app already in the field. **Do not rename paths or change response shapes incompatibly.**

There is no Swagger/OpenAPI endpoint. Request bodies are defined by the Zod schemas in each `*.routes.ts`.

## Authentication

- `POST /auth/login` with `{ email, password }` (or `{ email, otp }`) returns `{ access_token, refresh_token, user: { id, name, email, role, platformAdmin, organizationId } }`.
- Send `Authorization: Bearer <access_token>` on every other request. Access tokens are HS256 JWTs that expire after 15 minutes. The payload carries `sub`, `orgId`, `role`, `platformAdmin`, `distributorId` and `territoryIds`.
- `POST /auth/refresh` with `{ refreshToken }` returns a new pair. Refresh tokens rotate on every use, and reusing an old one revokes the session.
- The organisation always comes from the token. Any organisation id in a body or query is ignored.
- Authorization is `requirePermission(Resource, Action)` from `packages/permissions`. See [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md).

## Conventions

- **Bodies** are JSON (max 2 MB). Unknown keys are stripped by Zod, and keys starting with `$` or containing `.` are removed.
- **Status codes:** `POST` returns 201 by default and everything else 200. Some auth routes return 200 explicitly.
- **Idempotency:** orders, collections, visit check-ins and sync pushes accept an `idempotencyKey` **in the body**. A retried request with the same key returns the original record instead of creating a duplicate. There is no `Idempotency-Key` header.
- **Lists** return plain arrays scoped to the caller's organisation, hierarchy and role. There is no cursor pagination.

## Error format

Every error has the same shape:

```json
{ "statusCode": 400, "message": ["items.0.quantity: Number must be greater than 0"], "error": "Bad Request" }
```

`message` is a string, or an array of strings for validation errors.

| Code | When |
|------|------|
| 400 | Validation failure, malformed JSON, invalid ObjectId (CastError), Mongoose validation error |
| 401 | Missing, invalid or expired token; wrong credentials; locked account |
| 403 | Role lacks the permission, or the resource is outside the caller's scope |
| 404 | Not found (within the tenant) or unknown route |
| 409 | Duplicate key (unique index) or a business conflict |
| 413 | Body or upload too large (JSON > 2 MB, photo > 5 MB) |
| 429 | Rate limit exceeded (see [SECURITY.md](SECURITY.md#rate-limits-coreratelimitts)) |
| 500 | Unexpected error (generic message; details only in server logs) |
| 503 | `/health` when MongoDB is down |

## Endpoints

### Health (public)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Pings MongoDB: 200 `{status:"ok"}` or 503. Render health check. |
| GET | `/api/v1/health/live` | Liveness, no DB call |
| GET | `/api/v1/health/ready` | Readiness (reports whether `MONGODB_URI` is configured) |

### Auth (`/auth`)
| Method | Path |
|--------|------|
| POST | `/auth/register`, `/auth/login`, `/auth/otp/request`, `/auth/otp/verify` |
| POST | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/accept-invitation` |
| POST | `/auth/refresh`, `/auth/logout`, `/auth/push-token` |
| GET / DELETE | `/auth/sessions`, `/auth/sessions/:id` |
| GET / POST | `/auth/sso/google[/callback]`, `/auth/sso/microsoft[/callback]`: mock SSO, 404 unless `MOCK_SSO_ENABLED=true` outside production |

### Organisation and users
| Mount | Routes |
|-------|--------|
| `/users` | `GET /`, `POST /`, `POST /invites`, `PUT /:id`, `DELETE /:id` |
| `/settings` | `GET /`, `GET /branding`, `PUT /` |
| `/onboarding` | `GET /`, `PUT /step/:stepNumber`, `POST /complete` |
| `/hierarchy` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |

### Catalogue and pricing
| Mount | Routes |
|-------|--------|
| `/products` | `GET /`, `GET /catalog`, `GET /:id/outlet/:outletId`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/outlets` | `GET /`, `POST /export` (`GET /export` is rejected: exports must be audited), `GET /:id/360`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/approve` |
| `/distributors` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/price-lists`, `/schemes`, `/tax-rates` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |

### Orders and supply chain
| Mount | Routes |
|-------|--------|
| `/orders` | `GET /` (`?mine=true`), `GET /:id`, `POST /`, `PUT /:id/status`, `POST /:id/approve`, `/:id/reject`, `/:id/dispatch`, `/:id/cancel` |
| `/inventory` | `GET /`, `GET /batches/:productId`, `POST /adjust` |
| `/dispatches` | `GET /`, `POST /`, `POST /:id/deliver` |
| `/returns` | `GET /`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `POST /:id/approve`, `POST /:id/reject`, `DELETE /:id` |
| `/approvals` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`; rules: `GET/POST /rules`, `PUT/DELETE /rules/:id` |

### Finance and performance
| Mount | Routes |
|-------|--------|
| `/collections` | `GET /`, `POST /`, `PATCH /:id/status`, `PUT /:id`, `POST /:id/reverse`, `DELETE /:id` |
| `/api/v1/finance` | `GET /invoices`, `POST /invoices`, `GET /ledger/:outletId` |
| `/targets` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/incentives` | `GET /plans`, `POST /plans`, `GET /payouts`, `POST /payouts`, `PATCH /payouts/:id/status` |
| `/api/v1/performance` | `GET /dsr`, `/targets`, `/team-dsr`, `/team-targets` |

### Field operations
| Mount | Routes |
|-------|--------|
| `/attendance` | `POST /start`, `POST /end`, `GET /me`, `GET /history`, `GET /regularizations/pending`, `POST /regularizations/:sessionId/approve`, `POST /:sessionId/regularize` |
| `/beats` | `GET /today`, `GET /deviation`, `GET /team-today`, `GET /`, `POST /`, `PATCH /:id`, `POST /:id/publish`, `POST /:id/assign` |
| `/visits` | `POST /check-in`, `POST /:id/check-out`, `POST /:id/activities` |
| `/tracking` | `POST /bulk` (location pings), `GET /` |
| `/live-map` | `GET /reps` (polled by the web every 5 s), `GET /stream` (Server-Sent Events) |
| `/sync` | `GET /pull?lastSyncTimestamp=`, `POST /push` (`{ orders?, visits?, collections? }`), see [OFFLINE_SYNC.md](OFFLINE_SYNC.md) |
| `/uploads` | `POST /visit-photo` (multipart field `photo`, JPEG/PNG/WebP ≤ 5 MB, returns `{ url }`); `GET /:filename` is public |

### Reports, analytics, notifications
| Mount | Routes |
|-------|--------|
| `/analytics` | `GET /dashboard` |
| `/reports` | `GET /`, `GET /stats`, `POST /run`, `GET /jobs/:id`, `GET /exports/:id`, `POST /schedule`, `GET /schedules` |
| `/notifications` | `GET /`, `PUT /read-all`, `PUT /:id/read`, `POST /sms`, `POST /whatsapp` (sent via Brevo; only logged without `BREVO_API_KEY`) |
| `/support` | `POST /tickets`, `GET /tickets` |

### Platform (Super Admin, `requirePlatformAdmin`)
| Mount | Routes |
|-------|--------|
| `/superadmin` | `GET /dashboard`, `GET/POST /tenants`, `PATCH /tenants/:id/status`, `PATCH /tenants/:id/subscription`, `POST /tenants/:id/billing`, `GET /users`, `GET /analytics`, `GET /reports/logins`, `GET /tickets`, `PATCH /tickets/:id/status`, `GET/PATCH /settings`, `GET /audit`, `GET /metrics` |
