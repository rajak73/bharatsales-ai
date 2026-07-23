# Known Gaps & Limitations - BharatSales AI

The following functionalities are either partially implemented or missing as per the Complete Master BRD and the Final Acceptance Gate. These must be addressed in subsequent development cycles.

## 1. Inventory Batch Allocation (FEFO)
- **Gap:** The `OrdersService` currently validates total stock quantity but does not perform First Expire First Out (FEFO) batch allocation. 
- **Impact:** While stock is decremented accurately, specific batch traceability and expiry prioritization are not enforced server-side.

## 2. Collections and Payment Reversals
- **Gap:** Credit limits and outstanding balances are verified during order creation (triggering `Hold_Credit` states), but there is no explicit `CollectionsService` to generate receipts or process financial reversals.
- **Impact:** Finance Users cannot yet reconcile payments or reverse erroneous ledger entries via the API.

## 3. Dispatch, Delivery, and Partial Fulfilment
- **Gap:** `dispatch.schema.ts` exists, but the complete API workflow for partial fulfilment, proof of delivery, and short/damaged deliveries is currently a stub. Returns and claims workflows are missing.
- **Impact:** Distributor/Warehouse users can create orders but cannot record granular delivery discrepancies.

## 4. Stale Live Location Handling
- **Gap:** The API correctly stores `serverTimestamp` and `deviceTimestamp`. However, the Manager Dashboard (Map) does not explicitly differentiate or filter out "stale" location pings if a device goes offline.
- **Impact:** Managers might see a rep's last known location as "Live" without a visible stale-data warning.

## 5. Scoped Asynchronous Exports
- **Gap:** The BRD mandates tenant-scoped, audited, and asynchronous large data exports. No CSV/Excel export APIs currently exist.
- **Impact:** Data must be queried directly from the database or via the standard JSON APIs.

## 6. Live Integrations (External Services)
- **Gap:** Integrations (Razorpay, Tally ERP 9, Shopify) are currently seeded as configurations (`Live` / `Mock` states) to satisfy UI validation, but the actual adapter logic to push/pull data from these third parties is not wired up.
- **Impact:** Real production credentials and adapter testing are required before these integrations can operate.
