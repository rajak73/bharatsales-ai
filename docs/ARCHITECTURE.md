# BharatSales AI - Architecture

## System overview

BharatSales AI is a multi-tenant SaaS platform for Indian FMCG, pharma and distribution businesses. It connects companies, field sales teams, distributors, warehouses and retail outlets on one operational system.

```
 Android app (Expo)   Field PWA (React+Vite)   Web dashboard (React+Vite)
          \                  |                        /
           \                 |                       /
            +---- @bharatsales/api-client (HTTPS + Bearer JWT) ----+
                                  |
                   API: Node.js + Express + TypeScript  (Render)
                                  |
                        MongoDB replica set (Atlas)
                   (data + uploaded photos in GridFS)
```

## Technology stack

| Part | Stack |
|------|-------|
| API (`apps/api`) | Node.js 22, Express 4, TypeScript, Mongoose 8, Zod, jsonwebtoken, bcryptjs, helmet, express-rate-limit, multer, node-cron |
| Database | MongoDB replica set (transactions), GridFS for photos |
| Web dashboard (`apps/web`) | React 18, Vite, react-router 6, Tailwind, Recharts, Leaflet; shared components from `packages/ui` (see `apps/web/UI_GUIDE.md`) |
| Field PWA (`apps/field-pwa`) | React 19, Vite, service worker (vite-plugin-pwa, injectManifest), Dexie (IndexedDB) offline queue. Capacitor is configured, but no native project is checked in. |
| Mobile (`apps/mobile`) | Expo / React Native, expo-router, SecureStore for tokens, expo-sqlite offline queue, EAS Build |
| Shared packages | `api-client` (typed HTTP client), `permissions` (RBAC matrix), `shared-types`, `ui` |
| Tooling | pnpm workspaces, Turborepo, Jest + Supertest + mongodb-memory-server, Playwright, GitHub Actions |

## API (`apps/api/src`)

The API is a plain Express application. There is no framework DI or decorators: wiring is explicit TypeScript.

### Boot sequence (`main.ts`)
1. `loadEnv()` (`env.ts`) validates `process.env` with Zod and exits with every problem listed if it is invalid (for example `JWT_SECRET` shorter than 32 characters in production, missing `MONGODB_URI` in production).
2. `mongoose.connect(MONGODB_URI)`.
3. `buildContainer(connection)` (`container.ts`) creates all models and services.
4. `createApp(container)` (`app.ts`) builds the Express app; `app.listen(PORT)` (default 6002).
5. `startScheduler(container)` (`scheduler.ts`) starts the node-cron jobs (Asia/Kolkata): inventory reservation cleanup every 15 minutes, target roll-up and missed-outlet notifications at midnight.
6. SIGTERM / SIGINT stop the scheduler, close the server and disconnect Mongo.

### Container (`container.ts`, `models.ts`)
- `registerModels(conn)` registers every Mongoose schema from `schemas/` on the connection and returns the models.
- `buildContainer(conn, opts)` instantiates every service in dependency order with constructor injection (`new OrdersService(m.Order, m.Outlet, ..., inventoryService, approvalsService, ...)`) and returns one object holding them all. Services have no circular dependencies.
- The upload storage provider is chosen by `STORAGE_DRIVER` (`gridfs` by default, `local` for disk) and can be overridden in tests through `opts.storageProvider`.
- Tests build the same container on an in-memory MongoDB (`src/test/test-app.ts`: `bootTestApp`, `seedTestDatabase`).

### Express app (`app.ts`)
Global middleware, in order:

1. `trust proxy` from `TRUST_PROXY` (default 1 hop), `x-powered-by` disabled
2. `helmet` security headers
3. `compression` (skipped for Server-Sent Events)
4. `cors` with the `CORS_ORIGINS` allow-list (fails closed in production when unset; requests without an `Origin`, such as the mobile app, are allowed)
5. `express.json` / `urlencoded` with a 2 MB limit
6. `sanitizeInput` (strips `$`-prefixed and dotted keys: NoSQL operator injection)
7. `apiLimiter` global rate limit

Then one router per domain is mounted, then `notFoundHandler` and `errorHandler`.

| Mount path | Router |
|------------|--------|
| `/`, `/health` | `app.routes.ts` (`/api/v1/health/live`, `/ready`), `health/health.routes.ts` |
| `/auth`, `/users`, `/settings`, `/onboarding` | identity and tenant settings |
| `/orders`, `/inventory`, `/dispatches`, `/returns` | orders and supply chain |
| `/collections`, `/api/v1/finance`, `/approvals`, `/targets`, `/incentives` | finance and performance |
| `/superadmin`, `/support`, `/reports`, `/analytics`, `/api/v1/performance` | platform and reporting |
| `/beats`, `/attendance`, `/visits`, `/tracking`, `/live-map`, `/sync`, `/hierarchy` | field operations |
| `/outlets`, `/products`, `/distributors`, `/notifications`, `/tax-rates`, `/schemes`, `/price-lists`, `/uploads` | catalogue and misc |

Paths are unprefixed (except the three `/api/v1/*` groups) for backward compatibility with the Android app already in the field. Route paths and response shapes must not change incompatibly.

### Domain modules
Each domain folder holds:

- `<domain>.routes.ts`: `create<Domain>Router(deps)` returns an Express `Router`. A typical route chains the `core/` middleware:
  ```ts
  router.use(authenticate);
  router.post('/', requirePermission(Resource.Outlets, Action.Create),
    audit(auditService, 'Outlet'), validateBody(createOutletSchema),
    route((req) => outletsService.create(req.user.orgId, req.user.sub, req.body)));
  ```
- `<domain>.service.ts`: business logic on Mongoose models, independent of HTTP. Tenant scope (`organizationId`) always comes from `req.user.orgId`, never from the request body.
- `*.spec.ts`: unit specs for services, Supertest specs for routers, integration specs against MongoDB.

### Shared HTTP layer (`core/`)

| File | Responsibility |
|------|----------------|
| `auth.middleware.ts` | `authenticate` (HS256 Bearer JWT -> `req.user`), `requirePermission(resource, action)` (RBAC from `@bharatsales/permissions`), `requireRoles(...)`, `requirePlatformAdmin` |
| `http.ts` | `route(handler)` sends the return value as JSON (201 for POST, 200 otherwise) and forwards errors; `validateBody` / `validateQuery` parse with Zod and strip unknown keys |
| `http-errors.ts` | `BadRequestException`, `NotFoundException`, ... carrying the status code |
| `error-handler.ts` | one `{ statusCode, message, error }` error body for every failure; maps Mongoose CastError/ValidationError to 400 and duplicate keys to 409; hides internals on 500 |
| `validation.ts` | email normalisation and the shared password policy |
| `sanitize.middleware.ts` | NoSQL operator-injection guard |
| `rate-limit.ts` | global and per-auth-endpoint limiters |
| `audit.middleware.ts` | writes an `audit_logs` entry after successful mutations, with secrets redacted |
| `logger.ts` | context-tagged console logger |

### Transactions
Order creation, dispatch, collections and offline sync pushes run inside MongoDB multi-document transactions (`connection.startSession()`), which is why MongoDB must be a replica set in every environment (Atlas, the `rs0` compose service, `MongoMemoryReplSet` in tests).

### Real-time and uploads
- `GET /live-map/reps` returns the current rep positions. The web live map **polls it every 5 seconds**, skipping ticks while the tab is hidden, because a browser `EventSource` cannot send the Bearer token. `GET /live-map/stream` (Server-Sent Events, never compressed) exists, but no client uses it today.
- `POST /uploads/visit-photo` (authenticated, `Visits:Create`) accepts one image of up to 5 MB. The type is detected from the file's bytes (JPEG / PNG / WebP). The image is stored through the storage provider under a server-generated 128-bit random name, and the route returns `{ url: "/uploads/<name>" }`.
- `GET /uploads/<name>` is public, so `<img>` tags work without headers. The random name acts as the capability. It streams from GridFS first, then falls back to legacy files on the local disk (`apps/api/uploads`, read-only), with `nosniff` and a sandboxing CSP header.
- Storage is chosen by `STORAGE_DRIVER`: `gridfs` (default) is bucket `uploads` in the same MongoDB database; `local` is the disk, for development only.

## Clients

- **`packages/api-client`** is the single HTTP client for all three apps: axios with a 60-second timeout, a Bearer token and a queued refresh-token retry on 401. Its base URL comes from `EXPO_PUBLIC_API_URL` (mobile) or `VITE_API_URL` (web / PWA), falling back to `http://127.0.0.1:6002`. It still checks a leftover `NEXT_PUBLIC_API_URL` first, which no app sets.
- **Web** (`apps/web/src`): `App.tsx` declares react-router routes with `React.lazy` pages under `pages/`. `components/layout` holds the dashboard shell, `components/routing` the role guard (`RequireRole`) and page loader, and `contexts/CurrentUserContext` the session. The UI comes from `packages/ui` (tokens in `packages/ui/tailwind.config.js`, rules in `apps/web/UI_GUIDE.md`).
- **Field PWA** (`apps/field-pwa/src`): screens for the rep's day; `database/` (Dexie) holds the offline queue; `sync/` pushes queued orders / visits with idempotency keys and retries with backoff.
- **Mobile** (`apps/mobile`): expo-router route groups `(rep)` and `(distributor)`. `src/db` (SQLite) holds the offline queue, stamped with the owning user. `src/sync` replays it with exponential backoff and classifies errors as transient or permanent (see [OFFLINE_SYNC.md](OFFLINE_SYNC.md)). Tokens live in SecureStore. Theme tokens (`src/theme/tokens.ts`) mirror the web design system (navy `#0B1F44`, blue `#1B4FD8`, saffron `#FF8A1F`).

## Multi-tenant model

```
Organization -> Business Unit -> Zone -> Region -> Area -> Territory -> Beat -> Outlet
```

- Every tenant document carries `organizationId`; services filter on the `orgId` from the verified JWT.
- Hierarchy scope (`hierarchy/team-scope.ts`) limits managers to their own subtree.
- Unique indexes are tenant-scoped.

## User roles

`packages/permissions` defines exactly five roles (the `Role` type, also `UserRole` in `shared-types`). Finer distinctions come from the sales hierarchy, not from extra roles. For example, a national and an area manager are both `Sales Manager` with different territories.

| Role | Scope | Primary use |
|------|-------|-------------|
| Super Admin | Platform (`platformAdmin` flag) | Tenant management via `/superadmin/*`. Deliberately has almost no tenant-data permissions in the matrix. |
| Organization Admin | Own organisation | Full configuration: users, catalogue, pricing, hierarchy, beats, finance, reports |
| Sales Manager | Own hierarchy subtree | Team, approvals, targets, live map, beat assignment |
| Sales Representative | Own work | Attendance, visits, outlets, orders in the field |
| Distributor | Own distributor | Orders, inventory, dispatch, returns, collections, staff users |

The API uses `RBAC.can(role, action, resource)` through `requirePermission`. The web gates pages with `RequireRole`. See [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md).

## Core workflows

**Order to collection**
```
Outlet visit -> Order booking -> Price / scheme / GST -> Credit check -> Approval ->
Distributor allocation -> Dispatch -> Delivery -> Invoice -> Collection -> Outstanding update
```

**Field execution**
```
Start day (GPS) -> Beat -> Geofenced visit -> Photos / activities ->
Order / collection -> End day
```

**Inventory**
```
Receipt -> Stock movement -> Reservation -> FEFO allocation -> Dispatch -> Delivery
```

## Related documents
[API_CONTRACT.md](API_CONTRACT.md), [BUSINESS_RULES.md](BUSINESS_RULES.md), [ERD.md](ERD.md), [OFFLINE_SYNC.md](OFFLINE_SYNC.md), [SECURITY.md](SECURITY.md), [DEPLOYMENT.md](DEPLOYMENT.md).
