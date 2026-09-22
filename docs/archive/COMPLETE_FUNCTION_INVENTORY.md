# Complete Function Inventory - BharatSales AI

This document catalogs the verified functions and modules across the BharatSales AI ecosystem as part of the Final Release Audit.

## 1. Authentication & Security
- **AuthService:** `login`, `register`, `logout`, `getActiveSessions`, `revokeSession`
- **JwtStrategy:** Multi-tenant JWT decoding and validation.
- **TenantGuard:** Route protection ensuring cross-tenant queries are actively blocked.

## 2. Organization & Users
- **UsersService:** CRUD for organizational roles, sending email invitations.
- **HierarchyService:** Managing sales hierarchies (Managers -> Reps).
- **OutletsService:** Comprehensive CRM management for retail endpoints.
- **DistributorsService:** State-level and national distributor mapping.

## 3. Operations & Sales
- **OrdersService:** `create`, `updateStatus`, `approveOrder`, `dispatchOrder`, `cancelOrder`, `rejectOrder`. Fully integrates FEFO limits, manual batch overrides, credit exposure checks, and GST calculations.
- **PriceListsService:** Tiered pricing controls and limits.
- **SchemesService:** BOGO and discount scheme applications.
- **TargetsService:** Target vs Achievement processing.

## 4. Supply Chain & Inventory
- **InventoryService:** `getInventory`, `create`, `checkStockAvailable`, `reserveStock` (FEFO implementation), `deductStock`, `releaseReservedStock`, `adjustStock`.
- **DispatchService:** `createDispatchFromOrder`, `markDelivered` (maps shortages to partial delivery, returns and quarantine).
- **ReturnsService:** `createReturnFromShortDelivery`, reverse logistics tracking.
- **WarehousesService:** Multi-node stock locations.

## 5. Field Force Management (PWA)
- **AttendanceService:** `startDay`, `endDay`, `checkIn`, `checkOut`.
- **TrackingService:** `bulkCreatePings`, `getLatestPings` (Filters mock coordinates and stale location updates natively).
- **BeatsService:** Permanent journey planning and ad-hoc overrides.
- **VisitsService:** Executing beats, capturing competitor insights.

## 6. Finance & Collections
- **CollectionsService:** `create`, `updateStatus`, `remove`. Handles Ledger logic (decreases `outstandingBalance` when `Cleared`, re-adds when `Reversed`).
- **FinanceService:** Invoice generation natively integrated into dispatch delivery flows.
- **ExpensesService:** Field representative expense claiming.
- **ClaimsService:** Processing distributor claims for schemes and damages.

## 7. Architecture & Integrations
- **IntegrationAdapterService:** Interface for `WhatsappAdapter` and `TallyAdapter`.
- **ExportsService:** BullMQ-based asynchronous exports (`requestExport`, `getJobs`).
- **AiFeaturesService:** Smart insights via OpenAI bindings.
- **SyncService:** Offline-first PWA sync endpoint management (`pull`, `push`).

*Inventory Verified against API Source Code, Playwright UI capabilities, and existing Test Suites on 2026-07-24.*
