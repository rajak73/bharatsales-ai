# Attendance State Machine Report

This document specifies the validation and tests for the Attendance State Machine in BharatSales AI.

## Flow & State Constraints
1. **Start Day (`/attendance/start`)**:
   - Creates an `AttendanceSession` with `status: 'Active'`.
   - Idempotency: If a user calls `Start Day` while already having an `Active` session, the system returns the existing session instead of duplicating it or throwing an error.
2. **Check-in to Visit (`/visits/check-in`)**:
   - Allows users with an active AttendanceSession to check into an outlet.
   - Marks the visit as `Active`.
3. **End Day (`/attendance/end`)**:
   - Closes the active `AttendanceSession`, marking its status as `Completed` and stamping the `endTime`.
   - Automatically queries and closes any currently `Active` visits (changing status to `Completed` and stamping `checkOutTime`).

## Automated Tests

Run: `npx jest src/attendance/attendance.integration.spec.ts`

**Scenarios Tested:**
1. `Start Day creates a new active session`
   - Payload: Coordinates & accuracy.
   - Asserts: Status changes to `Active`.
2. `Start Day is idempotent (returns existing session)`
   - Payload: New coordinates.
   - Asserts: Original session is returned, no new records created in DB.
3. `Check-in to a visit`
   - Pre-condition: User has an active day.
   - Payload: `outletId`, Coordinates.
   - Asserts: New Visit is created with `status: 'Active'`.
4. `End Day closes active visits and attendance session`
   - Payload: End of day coordinates.
   - Asserts: `AttendanceSession` status becomes `Completed`. `Visit` status becomes `Completed` with a valid `checkOutTime`.

**Status**: STATE MACHINE VERIFIED. All edge cases related to duplicate sessions and orphaned visits handled successfully.
