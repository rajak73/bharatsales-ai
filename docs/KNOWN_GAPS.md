# BharatSales AI Known Gaps

Based on the audit of the existing codebase against the Master BRD:

- **Audit Logging**: While an `audit` module exists, we need to ensure that *every* state transition for business objects is captured strictly and idempotently.
- **Testing**: Jest testing framework is missing in `apps/api`. End-to-end UAT tests are not fully functional and need to be fleshed out to meet the robust UAT guidelines requested.
- **Authentication**: OTP, forgot password, and reset password flows in `auth.service.ts` are currently stubs and lack token persistence.
- **Deep Integrations**: Some specific AI guards mentioned in the BRD (e.g. deterministic fallbacks when AI provider fails) may need additional hardening.
- **Seed Scripts**: The `seed.ts` script exists but might need updating to ensure it creates exactly the scenario (2 organizations, all roles, multiple locations) requested in the BRD.
