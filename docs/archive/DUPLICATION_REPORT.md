# Duplication Report

**Date:** July 2026
**Status:** Initial Audit

This document identifies potential duplications in pages, API endpoints, database models, and logic across the BharatSales AI repository.

## Findings

1. **Pages and Routes**:
   - `apps/web/src/app/dashboard` and other frontend applications appear clean in terms of route duplications.
   - We must ensure that any similar dashboards (e.g., ASM vs Zonal) use reusable layout components rather than duplicating the entire page structure.

2. **API Endpoints**:
   - The backend `apps/api/src/` separates concerns into distinct modules (orders, outlets, schemes, etc.). No duplicate endpoint definitions were detected in the main controller structure.

3. **Database Models**:
   - The models in `apps/api/src/schemas/` need to be checked for overlap (e.g., ensuring `User` and `Distributor` references are centralized and not redefined).

4. **Business Logic**:
   - The `packages/business-rules` should act as the single source of truth. Some backend services might be duplicating validation that could be shared. This needs continuous checking during remediation.

5. **Action Plan**:
   - Eliminate hardcoded data in `approvals` and `devices` and map them to unified database models.
   - Refactor overlapping API return types in frontend/backend to use shared types from `packages/shared-types`.
