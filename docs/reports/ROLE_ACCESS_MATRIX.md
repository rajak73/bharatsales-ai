# Role Access Matrix

This matrix describes the access control configurations within BharatSales AI.
Authentication is secured using JWT, while Authorization is validated via `@RequirePermissions` decorators in NestJS using bitwise permission integers or role-based hierarchies.

| Role | Domain / Hierarchy Scope | Allowed Actions | Disallowed Actions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Global (System-wide) | Full control over system, billing, global organizations and system settings. | None. |
| **Organization Owner** | Tenant (Organization) | Full control within their tenant organization (Users, Outlets, Roles, Hierarchy, Orders, Billing). | Cannot access other organizations. |
| **Company Admin** | Tenant (Organization) | Administrative tasks within tenant, configure parameters, manage users (up to NSM level). | Cannot view or manage billing. |
| **National Sales Manager (NSM)** | Tenant (National) | View/manage all sales regions, approve overarching sales plans. | Cannot manage tenant-level settings. |
| **Zonal/Regional Manager** | Zone / Region | Manage Area Sales Managers, regional performance reports. | Cannot manage other zones. |
| **Area Sales Manager (ASM)** | Area | Manage Sales Representatives, approve orders/attendance in their area. | Cannot manage other areas. |
| **Sales Representative** | Individual | View assigned outlets, check-in, submit orders, log attendance. | Cannot view peers' data, cannot change organization data. |
| **Finance User** | Tenant (Finance) | View orders, billing, payments and generate invoices. | Cannot modify sales hierarchy or users. |
| **Distributor Owner** | Distributor Entity | View orders related to their distributor, manage distributor staff. | Cannot view organization-level metrics or other distributors. |
| **Distributor Staff** | Distributor Entity | Process specific orders assigned to them. | Cannot manage distributor settings. |
| **Auditor/Viewer** | Tenant (Read-only) | Read-only access to all reports and data within the tenant. | Cannot create, update or delete any records. |

### Verification Details
These constraints are enforced in the NestJS backend via:
1. `PermissionsGuard` which reads permissions metadata from routes.
2. `JwtAuthGuard` which decodes the JWT to establish the user's role and `orgId`.
3. Service-level filters that enforce `organizationId` across all queries to prevent horizontal privilege escalation.
