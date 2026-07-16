# BharatSales AI - API Contract

## Base URL
```
/api/v1
```

## Authentication
All endpoints require Bearer token except auth endpoints.
```
Authorization: Bearer <access_token>
```

## Standard Headers
- `Idempotency-Key` - Required for mutations (orders, visits, payments, dispatches)
- `X-Correlation-Id` - Optional, returned in response
- `X-Organization-Id` - Ignored (derived from token)

## Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Email/mobile + password login |
| POST | /auth/otp/request | Request OTP |
| POST | /auth/otp/verify | Verify OTP |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Logout current session |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | /dashboard/kpis | Get KPI summary |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| GET | /orders | List orders (paginated, filtered) |
| POST | /orders | Create new order |
| GET | /orders/:id | Get order details |
| POST | /orders/:id/approve | Approve order |
| POST | /orders/:id/cancel | Cancel order |

### Outlets
| Method | Path | Description |
|--------|------|-------------|
| GET | /outlets | List outlets |
| POST | /outlets | Create outlet |
| GET | /outlets/:id | Get outlet 360 |
| POST | /outlets/:id/approve | Approve pending outlet |

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET | /products | List products |
| GET | /catalog | Get catalog for field app |
| GET/POST | /prices | Price list management |
| GET/POST | /schemes | Scheme management |

### Attendance
| Method | Path | Description |
|--------|------|-------------|
| POST | /attendance/start | Start working day |
| POST | /attendance/end | End working day |
| GET | /attendance/me | Get my attendance |

### Visits
| Method | Path | Description |
|--------|------|-------------|
| POST | /visits/check-in | Check in to outlet |
| POST | /visits/:id/activities | Add visit activity |
| POST | /visits/:id/check-out | Check out |

### Collections
| Method | Path | Description |
|--------|------|-------------|
| GET | /outstanding | Get outstanding invoices |
| POST | /payments | Record payment |
| POST | /payments/:id/approve | Approve payment |
| POST | /payments/:id/reverse | Reverse payment |

### Targets
| Method | Path | Description |
|--------|------|-------------|
| GET | /targets/summary | Get target progress |
| GET/POST | /targets | Target management |

### Distributors
| Method | Path | Description |
|--------|------|-------------|
| GET | /distributors | List distributors |
| GET | /inventory | Get inventory overview |
| POST | /stock-movements | Record stock movement |
| POST | /allocations | Allocate stock |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| POST | /reports/run | Generate report |
| GET | /reports/jobs/:id | Get report status |
| GET | /exports/:id | Download export |

### Sync (Field PWA)
| Method | Path | Description |
|--------|------|-------------|
| POST | /sync/batch | Sync offline events |
| GET | /sync/status | Get sync status |

### Audit
| Method | Path | Description |
|--------|------|-------------|
| GET | /audit-logs | Get audit logs |

### Super Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | /super-admin/tenants | List all tenants |
| POST | /super-admin/tenants | Create tenant |

## Standard Error Response

```json
{
  "error": {
    "code": "ORDER_CREDIT_LIMIT_EXCEEDED",
    "message": "Order requires credit approval.",
    "field_errors": [],
    "correlation_id": "abc-123-def",
    "retryable": false
  }
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Malformed request |
| 401 | Authentication required |
| 403 | Not permitted |
| 404 | Not found (within tenant scope) |
| 409 | Conflict/duplicate |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |
| 503 | Service unavailable |

## Pagination

Cursor-based pagination for large lists:
```
GET /orders?cursor=eyJpZCI6...&limit=20&sort=-createdAt
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6...",
    "has_more": true,
    "total": 240
  }
}
```
