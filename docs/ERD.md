# BharatSales AI - Entity Relationship Diagram

## Core Entity Relationships

### Tenant & Organization
```
organizations (1) → (N) users
organizations (1) → (N) organization_settings
organizations (1) → (N) subscriptions
organizations (1) → (N) sales_hierarchy_nodes
```

### Sales Hierarchy
```
organizations (1) → (N) zones → (N) regions → (N) areas → (N) territories → (N) beats
beats (1) → (N) beat_outlets
beats (1) → (N) beat_plans (versioned)
territories (1) → (N) outlets (assignment history)
```

### Users & Permissions
```
users (N) → (1) roles
roles (N) → (N) permissions
users (1) → (N) user_scopes (hierarchy/territory/distributor)
users (1) → (N) employee_profiles
users (1) → (N) devices
users (1) → (N) sessions
```

### Products & Pricing
```
organizations (1) → (N) products
products (1) → (N) product_prices (effective-dated)
products (1) → (N) tax_rates (effective-dated)
organizations (1) → (N) schemes
```

### Outlets & Customers
```
organizations (1) → (N) outlets
outlets (1) → (N) outlet_documents
outlets (1) → (N) outlet_assignments (history)
outlets (N) → (1) distributors (fulfilling)
```

### Orders & Fulfillment
```
orders (1) → (N) order_items
orders (1) → (N) order_status_history
orders (N) → (1) visits (optional)
orders (N) → (1) outlets
orders (1) → (N) dispatches
dispatches (1) → (N) delivery_proofs
orders (1) → (N) invoices
```

### Inventory
```
organizations (1) → (N) warehouses
warehouses (1) → (N) inventory_batches
inventory_batches (1) → (N) stock_movements
distributors (1) → (N) inventory_batches
```

### Collections & Finance
```
invoices (N) → (N) payments (through payment_allocations)
payments (1) → (N) payment_allocations
outlets (1) → (N) invoices
```

### Field Execution
```
users (1) → (N) attendance_sessions
attendance_sessions (1) → (N) visits
visits (1) → (N) visit_activities
visits (1) → (N) location_points
```

### Targets & Performance
```
organizations (1) → (N) targets
targets (1) → (N) target_assignments
organizations (1) → (N) incentive_plans
```

### Audit & Sync
```
organizations (1) → (N) audit_logs
users (1) → (N) sync_events
organizations (1) → (N) idempotency_records
```

## Key Constraints

- All tenant data includes `organization_id`
- Unique constraints scoped by tenant (e.g., product SKU + org_id)
- Soft delete for business masters
- Immutable ledger entries (stock_movements, audit_logs)
- Status history for all state-machine entities
- Version fields for optimistic concurrency
