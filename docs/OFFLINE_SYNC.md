# BharatSales AI: Offline Sync

Both field clients, the **Android app** (`apps/mobile`) and the **field PWA** (`apps/field-pwa`), keep working without a network. They cache reference data locally and queue writes, then replay the queue against the normal REST endpoints when the device is back online. This document describes what the code does today.

## Local storage

| | Android app | Field PWA |
|---|---|---|
| Engine | `expo-sqlite` (`src/db/client.ts`) | Dexie / IndexedDB (`src/database/db.ts`) |
| Cached reference data | outlets, products, orders, schemes, distributors, invoices, collections, beats, beat schedules (JSON blobs keyed by id) | same table set |
| Write queue | `syncQueue` table (`src/db/syncQueue.ts`) | `syncQueue` store |
| Tokens | Expo SecureStore | `localStorage` (api-client default token storage) |

Reference data is refreshed by `pullSync()`, which makes one `GET` per resource (outlets, products, beats and so on) and replaces the local tables. Both clients use the regular endpoints. The batch `GET /sync/pull` and `POST /sync/push` endpoints exist in the API, but neither client uses them today.

## Queued actions (Android)

`SyncAction` in `apps/mobile/src/db/client.ts`, mapped to API calls in `src/sync/dispatch.ts`:

| Action | API call |
|--------|----------|
| `CREATE_ORDER` | `POST /orders` (body carries `idempotencyKey`) |
| `CREATE_PAYMENT` | `POST /collections` (body carries `idempotencyKey`) |
| `CREATE_VISIT` / `UPDATE_VISIT` | `POST /visits/check-in` (with `idempotencyKey`) / `POST /visits/:id/check-out` |
| `CLOCK_IN` / `CLOCK_OUT` | `POST /attendance/start` / `POST /attendance/end` |
| `CREATE_LOCATION_PING` | `POST /tracking/bulk` |
| `UPDATE_OUTLET` | `PATCH /outlets/:id` |
| `APPROVE_ORDER` / `REJECT_ORDER` / `DISPATCH_ORDER` | `POST /orders/:id/approve` / `reject` / `dispatch` (distributor) |
| `CONFIRM_DELIVERY` | `POST /dispatches/:id/deliver` (distributor) |

The field PWA queues the rep-side subset of these (`apps/field-pwa/src/sync/syncEngine.ts`).

## Queue item lifecycle

```
PENDING --send--> SYNCING --2xx--> removed from the queue
                     |
                     +-- transient error --> PENDING again, nextAttemptAt = now + backoff
                     +-- permanent error or 8th attempt --> FAILED (shown to the user)
```

- **Transient** (retried automatically): no HTTP response at all (offline, DNS, timeout, reset, a cold-starting Render instance), any 5xx, 408 or 429.
- **Permanent:** any other 4xx. The server looked at the request and rejected it, so resending the same payload will not help. The item becomes `FAILED` with the server's message, and the user can **Retry** or **Discard** it. On Android this happens in `SyncStatusCard`; the PWA has a `/sync-issues` screen.
- **Backoff:** 5 s, 10 s, 20 s, and so on, doubling up to a cap of 30 minutes (`retryPolicy.ts`, identical in both clients). After 8 attempts (`MAX_SYNC_ATTEMPTS`) the item is marked `FAILED`.
- Items are sent in FIFO order (`createdAt`, then `id`), and only once their `nextAttemptAt` has passed.

## When sync runs (Android)

- Right after an item is queued.
- When connectivity returns (NetInfo listener).
- When the app comes to the foreground, and every 2 minutes while it stays in the foreground.
- When the earliest backed-off item becomes due (a timer).

Only one sync runs at a time. A trigger that arrives during a run schedules another run afterwards. The PWA does the same with the browser `online` event and a retry timer.

## Queue ownership

Every queued item is stamped with the id of the user who queued it. Only that user's session ever sends it, so user B's token never submits user A's orders or payments on a shared device. Items belonging to another user show up as "foreign" and can only be discarded. Rows queued before ownership tracking existed are claimed by the first user who syncs after the upgrade.

## Duplicate protection (server)

- Orders, collections and visit check-ins carry a client-generated `idempotencyKey` (UUID). The services look it up within the organisation and return the existing record instead of creating a second one. A retry after a lost response is therefore safe.
- Order creation, collections and dispatch run in MongoDB transactions, so a failure half-way does not leave partial stock or ledger changes behind.
- The server derives the organisation and user from the token, and computes the geofence result (`distanceFromOutlet`, `isWithinGeofence`) and the collection status itself. It does not accept those from the device.

## Not implemented

These were in earlier design notes but are **not** in the code:

- An interactive conflict-resolution UI. A rejected item simply becomes `FAILED` with the server's message.
- Dependency ordering between queued events, beyond FIFO.
- Master-data version checks on queued orders.
- An explicit offline-login policy, such as a maximum offline session age.

Background location is not collected: `ACCESS_BACKGROUND_LOCATION` is blocked in `app.json`, and location pings are queued only while the app is open during a working day.
