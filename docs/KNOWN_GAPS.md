# Known Gaps

**Date:** July 2026

The following are the major functional gaps between the Master BRD requirements and the current repository state:

1. **Missing Backend APIs for critical flows**:
   - `offline-sync`: Required for the PWA field app to work reliably in poor network conditions.
   - `notifications`: Push and in-app notifications are entirely absent.
   - `integrations`: Adapters for ERP/Accounting software are missing.

2. **Hardcoded Frontend Integrations**:
   - Multiple `apps/web/src/app/dashboard` pages are entirely static UI shells using mock data. They need to be wired up to `apps/api` using the `api-client` package.

3. **Tenant Security**:
   - `organization_id` isolation is not enforced universally in all database schemas and controllers. This is a critical security gap that must be fixed before any production deployment.

4. **Business Logic Fragmentation**:
   - Certain calculations (e.g., GST or credit limits) appear to be missing or duplicated in the frontend rather than centralized in `packages/business-rules`.

5. **Advanced Features**:
   - AI-assisted beat planning and Smart Priority Score logic are not implemented.
   - Real-time geofence distance calculation needs to be fortified against spoofing.
