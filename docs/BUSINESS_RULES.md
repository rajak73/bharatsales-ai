# BharatSales AI - Business Rules Catalogue

## BR-001: Tenant Isolation
All business data MUST be tenant-isolated. Every query MUST include organization_id filter derived from the authenticated token. Client-supplied tenant IDs are ignored.

## BR-002: Geofence Verification
Outlet check-in is evaluated server-side using:
1. Stored outlet GPS coordinates
2. Reported device GPS coordinates
3. Configured geofence radius (default 5m)
4. GPS accuracy tolerance

Decision: Verified / Retry / Exception / Blocked

## BR-003: GPS Accuracy Storage
GPS accuracy and exception reason MUST be stored with every geofence decision for audit purposes.

## BR-004: GST Calculation
- **Intra-state supply** (fulfilling state = place of supply): CGST + SGST
- **Inter-state supply**: IGST only
- Tax rates come from effective-dated SKU tax master
- Rounding: line-level or document-level per policy

## BR-005: Tax Rate Effective Dating
Product tax rates are effective-dated. The rate applied to an order/invoice is the rate effective on the transaction date. Historical transactions retain the rate used at the time.

## BR-006: Credit Exposure Calculation
```
Projected Exposure = Current Outstanding
                   + Unbilled Delivered Value
                   + Approved Open-Order Value
                   + New Order Value
                   - Unapplied Approved Receipts

If Projected Exposure > Credit Limit → Hold_Credit (unless override authorized)
```

## BR-007: Overdue Invoice Blocking
If any invoice exceeds overdue tolerance:
- Block new orders, OR
- Hold for approval
Based on tenant policy configuration.

## BR-008: Batch Allocation Rules
- Batch-controlled allocation CANNOT use expired or blocked stock
- Manual batch selection requires permission AND reason
- Allocation must respect minimum shelf-life policy

## BR-009: FEFO Allocation
First-Expired-First-Out is the default for expiry-controlled products. The system selects the earliest valid expiry date that satisfies minimum shelf-life policy.

## BR-010: Stock Quantity Derivation
Stock quantity is ALWAYS derived from immutable stock movements. Never from a freely editable quantity field.

## BR-011: Payment Reversal
Payment approval changes outstanding. Reversal creates compensating entries — approved receipts are NEVER deleted.

## BR-012: Target Achievement Basis
Target achievement uses the transaction status configured as "eligible" by tenant policy (Submitted, Confirmed, Dispatched, Delivered, or Invoiced).

## BR-013: Offline Mutation Requirements
Every offline mutation MUST include:
- Idempotency key
- Device timestamp
- Server-estimated timestamp
- Master-data version references
- Schema version

## BR-014: Beat Plan Versioning
Published beat plan versions are immutable. Edits create a new version. Draft plans are invisible to representatives.

## BR-015: Outlet History Retention
Closed/merged outlets retain full history and are NEVER hard-deleted. Merged records redirect to canonical outlet.

## BR-016: AI Recommendation Guardrails
- Show reason for every recommendation
- Store rule/model version
- Show confidence/range
- Never silently add products
- Never auto-blacklist outlets
- Never auto-discipline employees

## BR-017: Export Auditing
All exports and sensitive data access are audited with actor, timestamp, scope, and record count.

## BR-018: Status Change Recording
Every status change stores: actor, timestamp, reason, source, and previous/new state.

## BR-019: Order Idempotency
Order submission uses Idempotency-Key header. Retries with the same key return the original result — never create duplicates.

## BR-020: Duplicate Payment Detection
System detects duplicate payment references within the same tenant and flags for review before approval.

## BR-021: Scheme Stacking Rules
Schemes have configurable stacking rules. Without explicit stacking approval, only the highest-eligible benefit applies.

## BR-022: Minimum Price Policy
Orders below minimum price require authorization per configured approval hierarchy.

## BR-023: Partial Fulfillment
Partial dispatch creates backorder or closes remaining quantity according to outlet and company policy.

## BR-024: Daily Run Rate
```
Required Daily Run Rate = (Period Target - Eligible Achieved Value) / Remaining Working Days
```

## BR-025: Visit Trust Signals
Visit verification considers: distance, GPS accuracy, server/device time difference, device integrity, duration, evidence, route consistency, and travel anomalies.
