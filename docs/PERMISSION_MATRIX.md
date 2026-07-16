# BharatSales AI - Permission Matrix

## Permission Dimensions

Authorization is the intersection of:
1. **Feature** - What module can be accessed
2. **Action** - What operation can be performed
3. **Scope** - What data scope is visible
4. **Status** - What record states are editable
5. **Field-level** - What fields are editable

## Role Permissions

### Super Admin
| Feature | View | Create | Edit | Approve | Delete | Export |
|---------|------|--------|------|---------|--------|--------|
| Tenants | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Plans | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| System Health | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tenant Data | Support only | ❌ | ❌ | ❌ | ❌ | ❌ |

### Company Admin
| Feature | View | Create | Edit | Approve | Delete | Export |
|---------|------|--------|------|---------|--------|--------|
| Users | ✅ | ✅ | ✅ | ✅ | Soft | ✅ |
| Products | ✅ | ✅ | ✅ | ✅ | Soft | ✅ |
| Outlets | ✅ | ✅ | ✅ | ✅ | Soft | ✅ |
| Orders | ✅ | ✅ | Own | ✅ | ❌ | ✅ |
| Distributors | ✅ | ✅ | ✅ | ✅ | Soft | ✅ |
| Hierarchy | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Settings | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

### Sales Manager (National/Zonal/Regional/Area)
| Feature | View | Create | Edit | Approve | Delete | Export |
|---------|------|--------|------|---------|--------|--------|
| Team | Scope | ✅ | ✅ | ✅ | ❌ | ✅ |
| Outlets | Scope | ✅ | ✅ | ✅ | ❌ | ✅ |
| Orders | Scope | ❌ | ❌ | ✅ | ❌ | ✅ |
| Beats | Scope | ✅ | ✅ | ✅ | ❌ | ✅ |
| Targets | Scope | ✅ | ✅ | ✅ | ❌ | ✅ |
| Reports | Scope | ❌ | ❌ | ❌ | ❌ | ✅ |

### Sales Representative
| Feature | View | Create | Edit | Approve | Delete | Export |
|---------|------|--------|------|---------|--------|--------|
| Own Attendance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assigned Outlets | ✅ | ✅ (Pending) | Own | ❌ | ❌ | ❌ |
| Orders | Own | ✅ | Own (Draft) | ❌ | ❌ | ❌ |
| Collections | Own | ✅ | ❌ | ❌ | ❌ | ❌ |
| Own Targets | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Expenses | Own | ✅ | Own (Draft) | ❌ | ❌ | ❌ |

### Distributor Owner
| Feature | View | Create | Edit | Approve | Delete | Export |
|---------|------|--------|------|---------|--------|--------|
| Own Inventory | ✅ | ✅ (movements) | ❌ | ❌ | ❌ | ✅ |
| Pending Orders | ✅ | ❌ | ✅ (confirm) | ❌ | ❌ | ✅ |
| Dispatch | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Returns | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Outstanding | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Staff | ✅ | ✅ | ✅ | ❌ | Soft | ✅ |

### Finance User
| Feature | View | Create | Edit | Approve | Delete | Export |
|---------|------|--------|------|---------|--------|--------|
| Outstanding | Scope | ❌ | ❌ | ❌ | ❌ | ✅ |
| Payments | Scope | ✅ | ❌ | ✅ | ❌ (reverse) | ✅ |
| Credit Limits | Scope | ❌ | ✅ | ✅ | ❌ | ✅ |
| Invoices | Scope | ❌ | ❌ | ❌ | ❌ | ✅ |
| Reports | Scope | ❌ | ❌ | ❌ | ❌ | ✅ |

### Auditor/Viewer
| Feature | View | Create | Edit | Approve | Delete | Export |
|---------|------|--------|------|---------|--------|--------|
| All (read-only) | Scope | ❌ | ❌ | ❌ | ❌ | ✅ |

## Field-Level Restrictions

| Role | Cannot Edit |
|------|-------------|
| Sales Rep | Credit limits, GST rates, product prices, tax masters |
| Distributor | Company product masters, tax rates, price lists |
| Manager (Area) | Company-wide settings, other territories' data |
| Finance | Product masters, outlet assignments |

## Scope Definitions

- **Organization**: All data within the tenant
- **Hierarchy**: Data within assigned hierarchy nodes
- **Territory**: Data within assigned territories
- **Own Team**: Direct reports and their data
- **Own Records**: Only records created by the user
- **Distributor**: Only assigned distributor data
