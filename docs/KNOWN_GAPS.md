# Known Gaps

Based on the audit of the existing repository against the BRD, the following known gaps exist and must be addressed during implementation:

## 1. Authentication & RBAC
- Role-based access control (RBAC) is not fully implemented. The current system provisions a new Tenant on register, but doesn't distinguish between Super Admin, Company Admin, Sales Manager, etc.
- Advanced auth workflows (OTP, Forgot Password, Reset Password, Session Revocation) are missing.

## 2. Organization & Hierarchy
- The organizational hierarchy (Zone -> Region -> Area -> Territory -> Beat) is not yet built.
- Tenant lifecycle statuses (Trial, Active, Past Due, Suspended, Archived) are not enforced.
- Organization Onboarding Wizard is completely missing.

## 3. Field PWA & Offline Sync
- The Service Worker for background sync is missing.
- The Dexie local database is set up, but the actual sync flushing logic to NestJS API is not implemented.
- Field Rep UI screens (Bottom Nav, Take Order, My Outlets) are missing.
- GPS and Geofencing validation are missing.

## 4. Products, Orders, & Operations
- `ProductsModule` API and Web UI are missing.
- Order booking engine, including GST calculation, Scheme resolution, and Credit Limit checks, is missing.
- Inventory management, distributor allocation, and dispatch/delivery workflows are completely missing.
- Collections and finance workflows (payment allocation) are missing.

## 5. Dashboards & Reports
- Role-specific dashboards with real data are missing.
- The reporting engine and asynchronous export jobs are missing.

## 6. AI & Integrations
- AI features (Smart Beat, SKU Recommendation) and their deterministic fallbacks are missing.
- Integration adapters (Maps, ERP, SMS/WhatsApp) are missing.

## Next Steps
The immediate priority is to solidify Phase 0 (RBAC, Tenant Lifecycle) and implement Phase 1 (Products, Hierarchy, Onboarding) before moving to the complex offline Field PWA logic and Order engines.
