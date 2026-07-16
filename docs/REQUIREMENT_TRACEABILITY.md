# Requirement Traceability Matrix

This matrix maps the BRD requirements to the existing implementation and highlights gaps.

| Req ID | Feature | Status | Notes / Next Steps |
|---|---|---|---|
| REQ-01 | Super Admin Console | 🔴 Missing | Needs implementation |
| REQ-02 | Company Admin Portal | 🟡 Partial | Web dashboard shell exists. |
| REQ-03 | Manager Dashboards | 🔴 Missing | Needs implementation |
| REQ-04 | Distributor Portal | 🔴 Missing | Needs implementation |
| REQ-05 | Field PWA | 🟡 Partial | Offline core exists, UI and sync engine missing. |
| REQ-06 | Multi-Tenant Architecture | 🟢 Complete | Custom JWT and `organizationId` enforced. |
| REQ-07 | Hierarchy Model | 🔴 Missing | Zone/Region/Area/Territory/Beat needs setup. |
| REQ-08 | Users, Roles & Permissions | 🟡 Partial | Auth exists, but RBAC is missing. |
| REQ-09 | Auth workflows | 🟡 Partial | Login/Register exist. OTP/Reset missing. |
| REQ-10 | Organization Onboarding | 🔴 Missing | Resumable wizard missing. |
| REQ-11 | Field Attendance | 🔴 Missing | Start/End day, GPS tracking missing. |
| REQ-12 | Geofencing & Tracking | 🔴 Missing | Location validation and live map missing. |
| REQ-13 | Beat Planning | 🔴 Missing | Beat assignment and Smart Priority Score missing. |
| REQ-14 | Outlet 360 | 🟡 Partial | API & Web table complete. Approval workflow missing. |
| REQ-15 | Products & Pricing | 🟡 Partial | Stubbed. Full API and UI needed. |
| REQ-16 | Orders & Approvals | 🔴 Missing | GST, credit holds, approval workflows missing. |
| REQ-17 | Inventory & Distributor | 🔴 Missing | FEFO allocation, stock movements missing. |
| REQ-18 | Dispatch & Delivery | 🔴 Missing | End-to-end fulfilment missing. |
| REQ-19 | Collections & Finance | 🔴 Missing | Outstanding tracking and receipt workflows missing. |
| REQ-20 | Targets & Performance | 🔴 Missing | Target tracking missing. |
| REQ-21 | Reports & Exports | 🔴 Missing | Role-specific reports and async exports missing. |
| REQ-22 | AI Features | 🔴 Missing | Smart recommendations and forecasting missing. |
| REQ-23 | Offline Sync | 🟡 Partial | Dexie queue exists, Service Worker missing. |

**Legend:**
- 🟢 Complete
- 🟡 Partial (Needs extension)
- 🔴 Missing (Needs full implementation)
