# Requirement Traceability

**Date:** July 2026

This document traces the Master BRD requirements to the existing codebase state.

1. **Multi-Tenant Org Model (BRD Sec 5)**
   - *Requirement*: Organization -> BU -> Zone -> Region -> Area -> Territory -> Beat -> Outlet
   - *Status*: Schema partially exists, needs strict hierarchy isolation checks in `apps/api/src/hierarchy`.

2. **Roles and Permissions (BRD Sec 6)**
   - *Requirement*: 11 defined roles, granular action permissions.
   - *Status*: `packages/permissions` is present but needs to be rigorously enforced on all `apps/api` endpoints using Guards.

3. **Auth & Security (BRD Sec 7)**
   - *Requirement*: Email/Mobile/OTP, device revoking, offline login.
   - *Status*: Mocked auth found. Needs complete real implementation with JWT and device verification.

4. **Org Onboarding (BRD Sec 8)**
   - *Requirement*: Resumable 7-step wizard.
   - *Status*: Basic UI routes exist in `apps/web/src/app/onboarding`, but backend state persistence is missing.

5. **Field Attendance & Start Day (BRD Sec 10)**
   - *Requirement*: Geolocation, battery, GPS accuracy tracking.
   - *Status*: `apps/api/src/attendance` needs real validation and distance calculation logic.

6. **Beat Planning & Outlet 360 (BRD Sec 12, 13)**
   - *Requirement*: Immutable beat plans, duplicate outlet detection.
   - *Status*: `beats` API partially implemented. Outlet creation needs duplicate checking and approval workflows.

7. **Offline PWA Sync**
   - *Requirement*: Sync queues and conflict resolution.
   - *Status*: Service worker present but `sync` backend API is missing.
