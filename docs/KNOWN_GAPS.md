# Known Gaps & Limitations - BharatSales AI

## Current Status
**All release-critical gaps have been resolved as part of the Final Acceptance Gate.**

## 1. Inventory Batch Allocation (FEFO)
- **Status:** ✅ RESOLVED. `OrdersService` now dynamically loops through all matching active batches and deducts sequentially, correctly utilizing `minShelfLifeDays` and manual allocations.

## 2. Collections and Payment Reversals
- **Status:** ✅ RESOLVED. Extracting invoice resolution to support targeted allocations and proper reversal logic without hard deletes.

## 3. Dispatch, Delivery, and Partial Fulfilment
- **Status:** ✅ RESOLVED. Dispatch and returns accurately manage status flow (Delivered, Partial_Delivery, Quarantine) and generate claims automatically for shortages.

## 4. Stale Live Location Handling
- **Status:** ✅ RESOLVED. Live Map UI and API dynamically filters out stale data (>15m) and shows an explicit `Offline` status.

## 5. Scoped Asynchronous Exports
- **Status:** ✅ RESOLVED. A full BullMQ asynchronous pipeline generates tenant-scoped CSV exports in the background.

## 6. Live Integrations (External Services)
- **Status:** ✅ RESOLVED. An abstract `IntegrationAdapterService` provides a unified syncing interface implemented by `TallyAdapter` and `WhatsappAdapter`.
