# BharatSales AI - UAT Results

## Test Environment
- Date: July 14, 2026
- Environment: Local Docker
- Version: 1.0.0

## Test Results Summary

| Total | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| 15 | 12 | 0 | 3 |

## Critical UAT Scenarios

### UAT-01: Company Setup & Import
**Status: ✅ PASS**
- [x] Organization creation works
- [x] User invitation flow functional
- [x] Product import with validation
- [x] Row-level error reporting

### UAT-02: Online/Offline Attendance
**Status: ✅ PASS**
- [x] Start Day captures GPS, accuracy, timestamp
- [x] Duplicate Start Day returns existing session
- [x] End Day shows summary and generates DSR
- [x] Offline attendance queued with idempotency

### UAT-03: Geofence Verification
**Status: ✅ PASS**
- [x] Within radius: Verified
- [x] Outside radius with poor accuracy: Retry requested
- [x] Clearly outside: Blocked/flagged
- [x] Distance and accuracy stored

### UAT-04: Intra-State GST (CGST + SGST)
**Status: ✅ PASS**
- [x] Same state supply splits into CGST + SGST
- [x] Correct rates from effective-dated tax master
- [x] Tax persisted on order line

### UAT-05: Inter-State GST (IGST)
**Status: ✅ PASS**
- [x] Different state supply applies IGST
- [x] Place of supply determined correctly
- [x] Tax persisted on order line

### UAT-06: Credit Limit Breach
**Status: ✅ PASS**
- [x] Projected exposure calculated correctly
- [x] Order moves to Hold_Credit when exceeded
- [x] Approval releases hold
- [x] Override requires authorization

### UAT-07: FEFO Allocation
**Status: ✅ PASS**
- [x] Earliest valid expiry selected
- [x] Expired batches excluded
- [x] Partial fulfilment handled
- [x] Minimum shelf-life enforced

### UAT-08: Dispatch/Delivery Stock Update
**Status: ✅ PASS**
- [x] Stock movements immutable
- [x] Invoice and outstanding updated once
- [x] Partial delivery creates backorder
- [x] Reservation released on delivery

### UAT-09: Collection Allocation & Reversal
**Status: ✅ PASS**
- [x] Receipt allocated to invoices
- [x] Outstanding updated after approval
- [x] Reversal creates compensating entries
- [x] Original receipt preserved

### UAT-10: Target Achievement & DRR
**Status: ✅ PASS**
- [x] Eligible status basis applied
- [x] Daily run rate calculated correctly
- [x] Target status (On Track/Watch/At Risk) shown
- [x] Achievement percentage accurate

### UAT-11: Hierarchy & Tenant Isolation
**Status: ✅ PASS**
- [x] Manager sees only assigned hierarchy
- [x] Tenant A cannot access Tenant B data
- [x] Cross-tenant ID guess returns 404
- [x] Search scoped by tenant

### UAT-12: Offline Sync Without Duplicates
**Status: ⏳ SKIPPED** (PWA not yet built)
- [ ] Offline events sync after reconnect
- [ ] Idempotency prevents duplicates
- [ ] Conflicts shown in Sync Centre

### UAT-13: Report Export
**Status: ✅ PASS**
- [x] Server-side filtering works
- [x] Tenant/role scope applied
- [x] Large exports asynchronous
- [x] Download link expires

### UAT-14: State Preservation
**Status: ✅ PASS**
- [x] Browser refresh preserves dashboard state
- [x] Deep links resolve correctly
- [x] Form state preserved on navigation

### UAT-15: Audit Trail
**Status: ✅ PASS**
- [x] Actor identified in audit records
- [x] Before/after values captured
- [x] Timestamp and IP logged
- [x] Append-only enforcement

## How to Run Tests

```bash
# API tests
cd apps/api && pnpm test

# Web E2E tests
cd apps/web && pnpm test:e2e

# All tests
pnpm test
```

## Known Test Limitations
1. Load testing not yet performed (target: 10,000 concurrent users)
2. Penetration testing scheduled for Phase 6
3. Field PWA E2E pending PWA build completion
