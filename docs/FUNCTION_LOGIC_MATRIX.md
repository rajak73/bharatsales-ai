# Function Logic Matrix

| Module | Sub-Module | Business Logic Requirement | DB Entity | API Endpoint | Test Status |
|--------|------------|----------------------------|-----------|--------------|-------------|
| **Tenant** | Isolation | Org ID strictly enforced on all reads/writes | `Tenant`, `Organization` | All | PENDING |
| **Auth** | Login | Rate limits, lockouts, correct session token | `User`, `Session` | `/auth/login` | PENDING |
| **Auth** | Invites | Expiry token, single-use, proper role grant | `Invitation` | `/auth/invite` | PENDING |
| **Field** | Attendance | Start Day captures location, time, battery | `AttendanceSession` | `/attendance/start` | PENDING |
| **Field** | Geofence | Server-side distance calculation, threshold rejection | `Visit` | `/visits/check-in` | PENDING |
| **Data** | Pricing | Hierarchy: Org -> Outlet -> SKU -> Promo | `PriceList`, `Scheme` | `/products/price` | PENDING |
| **Transactions**| Orders | Credit limit check, stock reservation (FEFO) | `Order`, `Inventory` | `/orders` | PENDING |
| **Transactions**| Payments | Unapplied receipts, invoice allocation | `Collection` | `/collections` | PENDING |
| **Operations** | Dispatch | Partial delivery allowed, failed dispatch rollback | `DispatchRecord` | `/dispatch` | PENDING |
| **Sync** | Offline | Idempotency keys, conflict resolution (queue) | `SyncQueue` | `/sync` | PENDING |
