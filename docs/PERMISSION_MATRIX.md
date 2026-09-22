# BharatSales AI: Permission Matrix

The single source of truth is `packages/permissions/src/index.ts` (`PermissionsByRole` and `RBAC.can(role, action, resource)`). The API enforces it with `requirePermission(Resource, Action)` in `apps/api/src/core/auth.middleware.ts`, The web dashboard gates pages by role (`RequireRole` in `apps/web/src/components/routing`), and the mobile app splits its screens into `(rep)` and `(distributor)` route groups. The table below is generated from that file. If the two ever differ, the code wins.

## Roles

There are exactly five roles (`Role` in `packages/permissions`, `UserRole` in `packages/shared-types`):

- **Super Admin**: platform operator. Uses `/superadmin/*`, which `requirePlatformAdmin` gates rather than this matrix. It deliberately gets no tenant operational data.
- **Organization Admin**: full control of one organisation.
- **Sales Manager**: any management level (national, zonal, regional, area). The level comes from the hierarchy and `territoryIds`, not from the role.
- **Sales Representative**: field execution.
- **Distributor**: a distributor's owner and staff.

Finance, audit or "viewer" users are not separate roles today. The demo seed creates `finance@` and `audit@` as Organization Admins.

## Matrix

R = read, C = create, U = update, D = delete, A = approve, E = export, · = no access.

| Resource | Super Admin | Organization Admin | Sales Manager | Sales Representative | Distributor |
|---|---|---|---|---|---|
| Users | · | R C U D E | R U | · | R C U D |
| Products | · | R C U D E | · | R | R |
| Outlets | · | R C U D A E | R C U D A | R C U | R |
| Orders | · | R C U D A E | R C U D A E | R C U | R C U A E |
| Distributors | · | R C U D E | R U | R | R |
| Settings | · | R C U D | · | · | · |
| Reports | · | R C U D E | R E | · | R E |
| Attendance | · | R U A E | R A E | R C U | · |
| Visits | · | R U E | R E | R C U | · |
| Collections | · | R C U D E | · | C | R C |
| Targets | · | R C U D | R C U E | R | · |
| Inventory | · | R C U E | · | · | R C U E |
| Approvals | · | R A | R A | R C | · |
| Beats | · | R C U D A | R A | R | · |
| LiveMap | · | R | R | · | · |
| Schemes | · | R C U D | R | R | R |
| Dispatch | · | R | R | · | R C U |
| Returns | · | · | · | · | R C U A |
| TaxRates | · | R C U D | R | R | · |
| PriceLists | · | R C U D | R | R | · |
| Analytics | · | R E | R E | · | R |
| Invoices | · | R C E | R | · | R |
| Notifications | R U | R U | R U | R U | R U |
| Hierarchy | · | R C U D | R | · | · |

## Scope on top of the matrix

The matrix only answers "may this role do this action on this resource at all". The services then narrow the data:

- **Tenant:** every query is filtered by `organizationId` from the verified JWT. Ids from the client are ignored.
- **Hierarchy:** Sales Managers see only their own subtree (`apps/api/src/hierarchy/team-scope.ts`).
- **Own records:** a Sales Representative sees only the orders they created (`createdByUserId`). For other roles, `GET /orders?mine=true` narrows the list to the caller's own orders.
- **Distributor:** Distributor users see only data for their `distributorId`.
- **Validation:** request bodies are Zod-validated and unknown keys stripped, so fields such as `role`, `platformAdmin`, `status` or balances cannot be set unless a route explicitly accepts them.

## Notable gaps

- **Sales Representatives have `Collections: create` only**, so reps can record payments from the Android app and field PWA (the collector is always set server-side to the logged-in rep) but cannot read the org-wide collections ledger.
- No field-level permissions: a role that may update a resource may update every field the route's schema accepts.
