# Role Access Matrix

| Role | Hierarchy Creation | Outlet Approval | Order Creation | Order Approval | Target Setup | Reporting | Inventory Allocation |
|------|-------------------|-----------------|----------------|----------------|--------------|-----------|----------------------|
| **Super Admin** | No (System level) | No | No | No | No | Tenant Stats | No |
| **Company Admin** | YES | YES | YES | YES | YES | ALL | YES |
| **National Mgr** | YES | YES | YES | YES | YES | ALL | YES |
| **Zonal/Reg Mgr**| Scoped | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped |
| **Area Mgr** | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped |
| **Sales Rep** | No | No (Request) | YES (Scoped) | No | No | Own | No |
| **Finance** | No | No | No | YES (Credit) | No | Finance | No |
| **Distributor** | No | No | No | No | No | Own | YES (Own) |
| **Auditor** | No | No | No | No | No | ALL (Read-only)| No |

*Status: Under verification via Playwright E2E and Jest Controller Specs.*
