# Geofencing & Visit Audit Report

This document confirms the geofencing calculations implemented in BharatSales AI.

## Implementation Details

**Algorithm**: Haversine Formula (Server-side calculation in `visits.service.ts`).
**Trigger**: When a Sales Representative calls `/visits/check-in` passing `lat` and `lng`.
**Validation**:
1. The backend retrieves the Outlet's target location (`latitude`, `longitude`) from the database.
2. `calculateDistance()` converts coordinates into distance (meters) using Earth's radius (6371 km).
3. If the distance is `<= 50 meters` (Configurable `GEOFENCE_RADIUS`), `isWithinGeofence` is logged as `true`. Otherwise, it logs `false`.
4. The system currently *logs* the anomaly but does not strictly prevent the check-in (to handle poor GPS accuracy indoors).

## Automated Tests

Run: `npx jest src/visits/visits.service.spec.ts`

**Unit Scenarios Tested:**
1. `calculates 0m for the exact same coordinates`
   - Payload: Outlet and Device coordinates match exactly.
   - Result: Distance 0.
2. `calculates correct distance between two known points`
   - Payload: Coordinates offset slightly.
   - Result: Mathematical verification passed (approx 44.47m).
3. `calculates correct distance for points over 50m apart`
   - Result: Verification passed (distance > 50).

**Integration Scenarios Tested:**
4. `sets isWithinGeofence=true when distance is under 50m`
   - Validates that the newly created Visit in MongoDB receives the `isWithinGeofence: true` flag and stores the exact distance.
5. `sets isWithinGeofence=false when distance is over 50m`
   - Validates that checking in from 155 meters away flags the Visit appropriately for audit review by managers.

**Status**: GEOFENCING LOGIC FULLY VERIFIED. Calculations are highly precise and successfully tied to the Visit entity.
