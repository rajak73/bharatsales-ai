# BharatSales AI - Offline Sync & Conflict Resolution

## Offline-Supported Actions

| Action | Offline Support | Notes |
|--------|----------------|-------|
| View assigned beat/outlets/catalog | ✅ Cached | Freshness indicator shown |
| Start/End attendance | ✅ Queued | Signed event with idempotency |
| Check-in/Check-out | ✅ Queued | GPS + device time + local ID |
| Order draft | ✅ Local | Full draft stored locally |
| Order submission | ✅ Queued | Idempotency key + master versions |
| Collection | ✅ Conditional | Only if policy permits |
| Photo/document | ✅ Queued | Upload state + retry |
| Approvals | ❌ Online only | Requires real-time validation |
| Admin changes | ❌ Online only | Requires full system access |

## Sync Event Structure

```json
{
  "local_event_id": "evt_abc123",
  "entity_type": "order",
  "operation": "create",
  "payload": { ... },
  "schema_version": "1.0",
  "idempotency_key": "idem_xyz789",
  "device_created_time": "2026-07-14T10:30:00+05:30",
  "estimated_server_time": "2026-07-14T05:00:00Z",
  "master_data_versions": {
    "price_list": "v3",
    "scheme": "v2",
    "outlet": "v1"
  },
  "dependency_event_ids": [],
  "retry_count": 0,
  "last_error": null,
  "status": "pending"
}
```

## Sync Statuses

| Status | Description |
|--------|-------------|
| pending | Waiting to sync |
| syncing | Currently being processed |
| synced | Successfully synchronized |
| conflict | Requires user resolution |
| failed | Error, will retry |

## Conflict Resolution Rules

| Conflict Type | Resolution |
|---------------|------------|
| Same order retried | Idempotency returns original server record |
| Price/scheme changed | Server recalculates, asks user if total changed |
| Outlet deactivated | Reject mutation, preserve local draft, explain |
| Stock changed | Accept hold/partial/rejection per policy |
| Concurrent edit | Return latest version with merge options |
| Photo upload failed | Keep business event, mark evidence pending |

## Sync Centre UI

The Sync Centre shows:
- Pending count
- Failed count
- Conflict count
- Last successful sync timestamp
- Per-item errors
- Retry and resolution actions

## Sync Guarantees

1. App restart MUST NOT lose queued events
2. Events are processed in dependency order
3. Failed events retry with exponential backoff
4. Conflicts require explicit user resolution
5. Sync status is always visible to the user

## Offline Login

Offline login is allowed ONLY when:
- Device was successfully authenticated earlier
- Tenant and user were active at last valid sync
- Offline access window has not expired
- Only cached/offline-safe actions are exposed
