# BharatSales AI - Operations Runbook

Production: API on Render (`bharatsales-ai`, https://bharatsales-ai.onrender.com), web dashboard on Vercel, MongoDB on Atlas. Local / self-hosted: `docker-compose.yml` (MongoDB replica set + API + web). See [DEPLOYMENT.md](DEPLOYMENT.md) for setup.

## Health checks

```bash
# Full check incl. a MongoDB ping (Render health check path). 200 = healthy, 503 = Mongo down.
curl https://bharatsales-ai.onrender.com/health
# Expected: { "status": "ok", "info": { "mongodb": { "status": "up" } }, ... }

# Liveness / readiness without a DB round-trip
curl https://bharatsales-ai.onrender.com/api/v1/health/live
curl https://bharatsales-ai.onrender.com/api/v1/health/ready
```

Locally replace the host with `http://localhost:6002`.

## Common operations

### Production (Render / Vercel)
- **Logs:** Render dashboard -> `bharatsales-ai` -> Logs. The API logs every unhandled error with its stack; boot failures print `CRITICAL: Invalid environment configuration` with every problem listed.
- **Restart / redeploy:** Render -> Manual Deploy -> "Deploy latest commit" (or "Clear build cache & deploy" after dependency changes).
- **Rollback:** Render -> Events -> pick a previous successful deploy -> Rollback. On Vercel: Deployments -> previous deployment -> Promote to Production.
- **Change env vars:** Render -> Environment. Saving triggers a redeploy. On Vercel, `VITE_*` values are inlined at build time, so redeploy after changing them.

### Local Docker
```bash
docker compose ps
docker compose logs -f api
docker compose restart api
docker compose up -d --build api     # rebuild after code changes
```

### Database backup / restore
```bash
# Atlas: use the Atlas backup / snapshot UI, or dump with the connection string:
mongodump --uri "$MONGODB_URI" --out ./backups/$(date +%Y%m%d)
mongorestore --uri "$MONGODB_URI" ./backups/<date>

# Local Docker
docker exec bharatsales-mongodb mongodump --out /backup/$(date +%Y%m%d)
docker cp bharatsales-mongodb:/backup/$(date +%Y%m%d) ./backups/
```

Uploaded photos are stored in MongoDB GridFS (`uploads.files` / `uploads.chunks`, `STORAGE_DRIVER=gridfs`), so a database backup includes them.

### Create the first production admin
```bash
# From a machine with the production MONGODB_URI; never run the demo seed on production.
cd server
NODE_ENV=production ALLOW_PROD_SEED=true MONGODB_URI="<atlas-uri>" \
  PLATFORM_ADMIN_EMAIL="<email>" PLATFORM_ADMIN_PASSWORD="<strong password>" \
  pnpm run seed:platform-admin
```

The seed scripts do not read `server/.env`. They print the connection URI, password included, so run them in a private terminal. Full notes: [DEPLOYMENT.md, step 6](DEPLOYMENT.md#6-create-the-first-platform-admin).

## Troubleshooting

### API does not start
1. Render logs show `CRITICAL: Invalid environment configuration`: fix the listed variable. In production `JWT_SECRET` must be at least 32 characters and `MONGODB_URI` is required.
2. `MongooseServerSelectionError`: check the Atlas network access list (Render egress IPs are dynamic, so allow `0.0.0.0/0` or use Render's static outbound IPs) and the credentials in `MONGODB_URI`.
3. Build fails with `tsc: not found`: the build must install devDependencies (`pnpm install --prod=false`, as in `render.yaml`).

### Transactions fail ("Transaction numbers are only allowed on a replica set member")
MongoDB is not a replica set. Atlas clusters always are; locally, `docker compose up mongo` initiates `rs0` automatically. Manual fix:
```bash
docker exec bharatsales-mongodb mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "mongo:27017"}]})'
```

### Web dashboard cannot reach the API
1. Browser console shows a CORS error: add the exact web origin (e.g. `https://your-site.vercel.app`, no trailing slash) to `CORS_ORIGINS` on Render. Unset in production = all cross-origin browser requests are denied.
2. Requests go to the wrong host: check `VITE_API_URL` on Vercel (API root, no `/api/v1`) and redeploy.
3. `curl <api>/health` fails: see "API does not start".

### Users get HTTP 429
Rate limits (see [SECURITY.md](SECURITY.md)): login is capped per IP + email, the global limit per user / IP. If many users share one office IP and hit limits, check that `TRUST_PROXY` matches the proxy hops (Render: `1`), otherwise every request appears to come from the proxy IP.

### Account locked
Five wrong passwords or OTPs lock an account for 15 minutes. It unlocks automatically; an admin can also reset the password.

### Photos missing after a deploy
Only happens with `STORAGE_DRIVER=local` (Render's disk is wiped on every deploy). Use `gridfs`.

## Monitoring

- Render health check on `/health` restarts the instance when MongoDB is unreachable.
- Watch: API error rate and 5xx in Render logs, Atlas connections / slow queries, 429 volume.
- The Render free plan sleeps after inactivity; the first request after that takes up to a minute. The API client uses a 60-second request timeout, and the Android sync queue retries timed-out requests with backoff. Upgrade the plan if reps regularly see timeouts.

## Maintenance

- Weekly: review Dependabot PRs (grouped minor/patch) and CodeQL alerts.
- Monthly: rotate `JWT_SECRET` (logs everyone out once) and the Atlas database password; review admin accounts.
- Scheduled jobs run inside the API process (Asia/Kolkata): inventory reservation cleanup every 15 minutes, target roll-up and missed-outlet notifications at midnight.
