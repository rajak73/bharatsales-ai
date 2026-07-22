# Phase 0: Existing Implementation Audit

This document classifies the current state of the repository against the Master BRD requirements.

## 1. Signup & Auth
- **Status**: `PARTIALLY_WORKING`
- **Current Implementation**:
  - `AuthController` exposes `/register`, `/login`, `/otp/request`, `/otp/verify`, etc.
  - `AuthService.register()` creates a `Super Admin` and a new Tenant.
  - `UsersService.inviteUser()` creates a user in `Invited` state with a random password.
- **Known Gaps**:
  - Public users could potentially pass a privileged role to an unprotected endpoint if one existed (though `register` forces `Super Admin` currently).
  - No explicit "Accept Invitation" endpoint where an invited user can verify identity and securely set their own password.
  - Role restrictions (e.g. only Company Admin can invite, preventing self-assigned roles) exist but need rigorous automated testing.

## 2. Roles & Hierarchy Permissions
- **Status**: `BACKEND_ONLY` (rudimentary)
- **Current Implementation**:
  - `@Roles()` and `PermissionsGuard` enforce basic JWT-based role strings.
  - `HierarchyService` exists but lacks rigorous interception/scoping of generic repository queries.
- **Known Gaps**:
  - Organization owner role is currently mixed (Super Admin). BRD prefers Company Admin for Org Owner and one global Super Admin.
  - Cross-tenant data isolation relies primarily on controllers explicitly passing `organizationId` from `req.user`. It is not enforced centrally at the repository level. No negative tests prove its efficacy.

## 3. Database Fetching
- **Status**: `PARTIALLY_WORKING`
- **Current Implementation**:
  - Most dashboards hit the correct API (`api/v1/...`).
  - Mongoose models exist for `Beat`, `Outlet`, `Order`, `Visit`, etc.
- **Known Gaps**:
  - UI pages like `dashboard/page.tsx` fetch data via `AnalyticsService`, but some values might not enforce strict hierarchy filtering for intermediate roles (e.g., Regional Manager only seeing their region).

## 4. Attendance
- **Status**: `PARTIALLY_WORKING`
- **Current Implementation**:
  - `AttendanceSession` tracks `startTime`, `endTime`, and location.
  - Deduping exists (Start Day returns existing session).
- **Known Gaps**:
  - Missing state machine states: `ON_BREAK`, `NOT_STARTED`. Currently only supports `Active` and `Completed`.
  - Missing capture of `networkState`, `batteryLevel`, and `selfie` as per BRD.
  - Missing test suite proving idempotency and out-of-shift validation.

## 5. Live Location & Geofencing
- **Status**: `PARTIALLY_WORKING`
- **Current Implementation**:
  - `LiveMapService` correlates `LocationPing`, `Visit`, and `AttendanceSession`.
  - Service Worker handles offline background sync.
- **Known Gaps**:
  - Geofence calculation (distance measurement) is not strictly validated server-side during check-in with exception logging.
  - Live location doesn't proactively reject pings if received outside of a valid `WORKING` attendance session.
  - Stale timestamp detection (hiding inactive reps) needs explicit server logic instead of just sorting by `deviceTimestamp`.

**Conclusion**: I will proceed with Phase 1 to seed the proper Organization data, and then Phase 2+ to implement these missing strict validations.
