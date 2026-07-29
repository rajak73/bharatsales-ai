# Known Gaps

1. Actual e2e test execution against the *deployed* Vercel and Render endpoints (Currently run locally via Playwright).
2. Deep dive edge cases for some AI logic (Churn risk prediction).
3. The BRD states offline mobile login is allowed under strict conditions, need to explicitly verify the PWA enforces `offline-login validity window`. (Verified Gap: PWA `AuthContext.tsx` and `api-client` do not currently record or check a `lastLoginTimestamp`).
4. Web UI for Session Management: The API backend supports `getActiveSessions` and `revokeSession`, but no UI exists in Web HQ to manage them.
5. Registration UI: `AuthService.register` exists in the API client but is unexposed in the UI.
6. **Disconnected Backend API Routes**: Over 34% of the backend API (46 out of 133 routes) is completely orphaned from the frontend. The `packages/api-client` does not export bindings for critical flows such as SSO (Google/Microsoft), Order and Return Approvals, Field Visit Check-outs, Finance Ledgers, and Offline Sync Push/Pull endpoints.
7. **GAP-12: Hallucinated Business Logic**: The `BUSINESS_LOGIC_VERIFICATION.md` claims several features are complete which do not exist in the codebase:
   - `OrdersService.checkCreditLimit` is completely missing.
   - `DispatchService` module is completely missing.
   - `ExportsService` module is completely missing.
   - `DashboardService` module is completely missing.
   - `SyncService.processQueue` is completely missing.
   - `Schemes` module is completely missing.
   - `Pricing` module is completely missing.
   - `GST` module is completely missing.
   - Attendance duplicate day prevention is literally commented out (`// if (completedToday) throw ...`).
