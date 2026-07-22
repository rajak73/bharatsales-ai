# BharatSales AI - Context & Progress Tracker

This document serves as the master memory and context for AI agents working on this project. 
**If you are an AI assistant starting a new session on this repository, READ THIS ENTIRE DOCUMENT FIRST.**

## Architecture Overview
- **Backend:** NestJS API (`apps/api`)
- **Frontend / Admin UI:** Next.js App Router (`apps/web`)
- **Frontend / Field App:** React PWA (`apps/field-pwa`)
- **Database:** MongoDB (accessed via Mongoose inside NestJS)
- **Monorepo Management:** Turborepo (`turbo`) and `pnpm` workspaces
- **Shared Packages:** `@bharatsales/shared-types`, `@bharatsales/api-client`, `@bharatsales/permissions`
- **Testing:** 
  - Jest for Unit / Integration tests
  - Playwright for End-to-End browser tests (stored in `/e2e`)

## Completed Phases (1-7)
The system has been heavily audited and hardened against the "Master BRD".

1. **Tenant Isolation & Security (Phase 1):** 
   - Strict Org-level tenant isolation is enforced at the Mongoose Schema level using `plugin(tenantPlugin)`.
   - `orgId` is injected from the JWT token via `JwtAuthGuard` into `req.user`.

2. **Role-Based Access Control (Phase 2):**
   - `@RequirePermissions(Resource, Action)` is fully implemented in controllers.
   - `PermissionsGuard` verifies roles (Super Admin, Organization Owner, Sales Rep, Distributor Owner, etc.).
   - The UI (`Sidebar.tsx`) dynamically renders options depending on the `userRole` returned in `AuthService.login`.

3. **Attendance & State Machine (Phase 3):**
   - Geofencing logic verified.
   - `Start Day` -> `Check In` -> `Check Out` -> `End Day` strictly enforced.
   - Integration tests: `apps/api/src/attendance/attendance.integration.spec.ts`

4. **Dispatch & Third-Party Integration (Phase 4-5):**
   - Atomic transactions (`mongoose.startSession`) used for capturing POD and automatically generating Invoices.
   - WhatsApp & Tally ERP simulator adapters are wired in.

5. **End-to-End Verification (Phase 7):**
   - A critical CORS bug in `apps/api/src/main.ts` was patched (allowing `http://localhost:6003`).
   - The path for auth was standardized to `@Controller('auth')` in `apps/api/src/auth/auth.controller.ts`.
   - Playwright suites (`npx playwright test e2e/roles.spec.ts` and `e2e/attendance.spec.ts`) now **pass 100%**, verifying UI -> API -> Database flow.

## Demo Users (Seed Data)
The database has been seeded with demo organizations ("Bharat Foods Pvt Ltd", "Raj Pharma Distributors").
Login credentials for testing:
- **Super Admin:** `admin@bharatsales.ai`
- **Organization Owner:** `admin@bharatfoods.com`
- **Sales Representative:** `rep@bharatfoods.com`
- **Distributor Owner:** `owner@citydistributors.com`
- **Password for all:** `password123`

## How to Run & Test
1. **Start infrastructure:** `docker-compose up -d` (starts MongoDB & Redis)
2. **Start API:** `cd apps/api && pnpm run dev` (Runs on `http://localhost:6002`)
3. **Start Web:** `cd apps/web && pnpm run dev` (Runs on `http://localhost:6003`)
4. **Run E2E Tests:** `npx playwright test e2e/roles.spec.ts` or `npx playwright test e2e/attendance.spec.ts`

## Where to Pick Up Next
- You can begin implementing any missing UI screens or remaining features in the BRD.
- Before writing new code, check `docs/PHASE_0_AUDIT.md`, `docs/KNOWN_GAPS.md`, and `docs/REQUIREMENT_TRACEABILITY.md` for what is strictly missing versus what just needs UI polish.
- Do NOT rewrite working backend endpoints (like `/auth/login` or `/outlets`) without checking how `api-client` expects them to respond.
