# BharatSales AI - Architecture

## System Overview

BharatSales AI is a multi-tenant SaaS platform for Indian FMCG, Pharma, and distribution businesses. It connects companies, field sales teams, distributors, warehouses, and retail outlets on a single operational system.

## Technology Stack

### Frontend
- **Web App**: Next.js 14 + TypeScript + Tailwind CSS
- **Field PWA**: React + Vite + Workbox (offline-first)
- **State**: TanStack Query, React Hook Form
- **UI**: shadcn/ui components, Recharts, Leaflet

### Backend
- **API**: NestJS + TypeScript
- **Database**: MongoDB with Mongoose (replica set for transactions)
- **Cache/Jobs**: Redis + BullMQ
- **Storage**: S3-compatible (MinIO for local)

### Infrastructure
- **Container**: Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Health endpoints + structured logging

## Multi-Tenant Model

```
Organization → Business Unit → Zone → Region → Area → Territory → Beat → Outlet
```

- Every record includes `organization_id`
- Tenant context derived from authenticated token
- Tenant-scoped indexes and unique constraints
- Complete data isolation between tenants

## User Roles

| Role | Scope | Primary Use |
|------|-------|-------------|
| Super Admin | Cross-tenant | Platform operations |
| Company Admin | Organization | Full configuration |
| National/Zonal/Regional/Area Manager | Hierarchy | Team management |
| Sales Representative | Own work | Field execution |
| Distributor Owner/Staff | Distributor | Fulfillment |
| Finance User | Financial | Collections, credit |
| Auditor/Viewer | Read-only | Reports, compliance |

## Core Workflows

### 1. Order-to-Collection
```
Outlet Visit → Order Booking → Price/Scheme/GST → Credit Check → Approval → 
Distributor Allocation → Dispatch → Delivery → Invoice → Collection → Outstanding Update
```

### 2. Field Execution
```
Start Day (GPS) → Smart Beat → Geofenced Visit → Activities/Photos → 
Order/Collection → End Day → DSR Generation
```

### 3. Inventory Flow
```
Receipt → Stock Movement → Reservation → Allocation (FEFO) → 
Dispatch → Delivery → Ledger Update
```

## Database Collections

Core collections include: organizations, users, roles, products, outlets, orders, order_items, order_status_history, attendance_sessions, visits, distributors, warehouses, inventory_batches, stock_movements, invoices, payments, targets, audit_logs, and more.

## API Design

- RESTful APIs under `/api/v1`
- JSON request/response
- Bearer token authentication
- Cursor pagination
- Idempotency-Key for mutations
- Standard error shape with correlation IDs

## Security

- JWT access + refresh tokens
- Role-based access control (RBAC)
- Tenant isolation at database and API level
- OWASP-aligned development
- Rate limiting and account lockout
- Audit logging for all mutations

## Offline Support (Field PWA)

- IndexedDB for local storage
- Offline queue with idempotency keys
- Background sync when online
- Conflict detection and resolution
- Sync centre UI for pending/failed items
