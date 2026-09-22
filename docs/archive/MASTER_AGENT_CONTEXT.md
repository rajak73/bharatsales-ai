# MASTER_AGENT_CONTEXT

## Project Purpose
BharatSales AI is a multi-tenant SaaS product for Indian FMCG, Pharma, Consumer Goods, and Agri-input businesses. It includes a public website, Super Admin console, Company Admin Portal, manager dashboards, field sales PWA, and backend APIs for field sales automation and distributor management.

## Current Stack and Architecture
- **Backend:** NestJS API (`apps/api`) running on port 6002
- **Frontend / Admin UI:** Next.js App Router (`apps/web`) running on port 6003
- **Frontend / Field App:** React PWA (`apps/field-pwa`) running on port 6001
- **Database:** MongoDB via Mongoose
- **Monorepo Management:** Turborepo and pnpm workspaces
- **Shared Packages:** `@bharatsales/shared-types`, `@bharatsales/api-client`, `@bharatsales/permissions`
- **Testing:** Jest (Unit/Integration) and Playwright (E2E)

## Current Branch and Startup Commands
- **Branch:** Assuming `main` or current working branch
- **Startup commands:**
  - `docker-compose up -d` (MongoDB & Redis)
  - `pnpm install`
  - `cd apps/api && pnpm run seed`
  - `pnpm run dev`

## Actual Flow Verifications (Playwright UI)
#### Live Location & Attendance (Verified)
- **Status:** ✅ VERIFIED via `e2e/attendance.spec.ts` and `e2e/live-map.spec.ts`
- **Methodology:** Playwright testing against real Field PWA and Manager Dashboard UIs.
- **Key Flows Validated:**
  - PWA Offline Sync Engine (IndexedDB/Dexie resilient mapping logic fixed).
  - Rep can Start Day, Check In, Check Out, and End Day through PWA UI.
  - Geo-location coordinates successfully transmitted to NestJS backend.
  - Manager Dashboard (`/live-map`) successfully displays active field reps and updates locations.

#### Check-In/Check-Out & Geofence (Verified)
- **Status:** ✅ VERIFIED via `e2e/attendance.spec.ts`
- **Methodology:** UI automation simulating outlet visit clicks and distance constraints.

#### Onboarding & Integrations UIs (Verified)
- **Status:** ✅ VERIFIED via `e2e/onboarding.spec.ts` and `e2e/integrations.spec.ts`
- **Methodology:** Playwright testing against real Web Dashboard UI.
- **Key Flows Validated:**
  - Full 8-step wizard completed for Company Profile, Fiscal Setup, Policies, Hierarchy, Users, Products, and Channels.
  - Integration dashboard configuration, API Key rotation, and external provider listing.

## Major Technical Decisions
- JWT `orgId` for tenant isolation (never trust client).
- Strict validation pipes stripping unknown fields.
- Decimal128 for financial fields.
- Atomic transactions (`mongoose.startSession`) for orders/invoices.

## Role Model
1. Super Admin, 2. Company Admin, 3. National Sales Manager, 4. Zonal Manager, 5. Regional Manager, 6. Area Sales Manager, 7. Sales Representative, 8. Distributor Owner, 9. Distributor Staff, 10. Finance User, 11. Auditor/Viewer.

## Exact Next Steps
- **Current Focus:** All UI and flow UAT requirements have been successfully passed. Staging readiness achieved.
- **Blockers:** None. Final handover phase.
