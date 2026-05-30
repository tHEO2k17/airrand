# Deployment guide

This document describes how to run airRand in a **staging-style** environment using Docker. It does not cover payment processing — airRand remains wallet-less with no financial custody.

## What you deploy

| Service | Port (example) | Dockerfile |
|---------|----------------|------------|
| PostgreSQL | 5432 (internal) | `postgres:16-alpine` (compose) |
| Redis | 6379 (internal / host in dev) | `redis:7-alpine` (compose) |
| API (Hono) | 3003 | `apps/api/Dockerfile` |
| Merchant UI (Next.js) | 3001 | `apps/merchant/Dockerfile` |
| Customer UI (Next.js) | 3002 | `apps/customer/Dockerfile` |
| Worker (BullMQ) | _(none — no HTTP)_ | `apps/worker/Dockerfile` |

## Prerequisites

- Docker and Docker Compose
- Node 20+ and pnpm (for local builds and migrations outside Docker)
- Secrets: `AUTH_SESSION_SECRET`, `QR_SIGNING_SECRET` (each ≥32 characters)

See [env-reference.md](./env-reference.md) for the full variable list.

## Local development (unchanged)

```bash
docker compose up -d          # Postgres (5433) + Redis (6379)
cp .env.example .env          # set secrets; REDIS_URL=redis://localhost:6379
pnpm install && pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Staging with Docker Compose

1. Copy the staging env template:

   ```bash
   cp .env.staging.example .env.staging
   ```

2. Edit `.env.staging` — set `AUTH_SESSION_SECRET` and `QR_SIGNING_SECRET` to strong random values. Keep `CORS_ALLOWED_ORIGINS` aligned with how users reach the merchant and customer UIs.

3. Build and start:

   ```bash
   docker compose -f docker-compose.staging.example.yml --env-file .env.staging up --build
   ```

4. Run migrations and seed (once per fresh database):

   ```bash
   docker compose -f docker-compose.staging.example.yml --env-file .env.staging run --rm api \
     sh -c "corepack enable && pnpm --filter @airrand/database db:migrate && pnpm --filter @airrand/database db:seed"
   ```

5. Verify:

   ```bash
   chmod +x scripts/smoke-staging.sh
   API_URL=http://localhost:3003 ./scripts/smoke-staging.sh
   ```

### Staging URLs (default compose ports)

| App | URL |
|-----|-----|
| API | http://localhost:3003 |
| Merchant | http://localhost:3001 |
| Customer | http://localhost:3002 |

Sign in to merchant with demo credentials from seed (local/staging only): see README **Merchant authentication**.

## Health and readiness

| Endpoint | Purpose | Success |
|----------|---------|---------|
| `GET /health` | Liveness — process is up | `200` `{ "data": { "status": "ok", ... } }` |
| `GET /ready` | Readiness — DB, Redis, secrets | `200` when checks pass; `503` otherwise |

Orchestrators should use `/health` for liveness and `/ready` for traffic routing after deploy.

Readiness response shape:

```json
{
  "data": {
    "status": "ready",
    "service": "airrand-api",
    "checks": {
      "database": "ok",
      "redis": "ok",
      "secrets": "ok"
    }
  }
}
```

Check values: `ok` | `failed` | `skipped`. **redis** is `skipped` when `REDIS_URL` is unset (local dev without Redis). When `REDIS_URL` is set (staging/production), **redis** must be `ok` or the API is not ready.

Readiness checks:

- **database** — `SELECT 1` via Drizzle
- **redis** — `PING` when `REDIS_URL` is configured
- **secrets** — `AUTH_SESSION_SECRET` and `QR_SIGNING_SECRET` present and ≥32 characters
- **storage** — bucket reachable via configured object storage provider (MinIO locally)

### Background worker (Phase 10A–10D)

| Property | Detail |
|----------|--------|
| Process | `apps/worker` — BullMQ consumers only |
| HTTP | **None** — do not route traffic to the worker |
| Redis | **Required** — same `REDIS_URL` as the API |
| Database | **Required** — same `DATABASE_URL` as the API (audit export + notification jobs) |
| Storage | **Object storage** — `@airrand/storage` (MinIO locally via `docker compose`; S3-compatible in production). Private bucket; API streams authenticated downloads |
| Queues | `audit.export.requested` (CSV generation), `notification.requested` (operational notifications, placeholder delivery) |

**Audit export:** `POST /merchants/:merchantId/audit-logs/export` creates an `audit_export_jobs` row and enqueues BullMQ work. The worker generates a CSV and the merchant downloads it via authenticated `GET .../exports/:exportJobId/download`. **No email** for the CSV file itself. When export completes, a **notification job** is queued for the requester (placeholder email channel — no SMTP yet).

**Operational notifications:** API enqueues on order `ready` and staff password reset; worker enqueues on export complete. All jobs are processed by the notification worker with placeholder channels only. See [architecture.md](./architecture.md#operational-notifications-phase-10d).

**Readiness:** The API `GET /ready` checks database, secrets, Redis (when configured), and object storage. The worker verifies Redis and storage on startup (no HTTP `/ready`). For staging compose, ensure the `worker` service stays running and logs `worker_started` on boot. If the worker exits, restart it; job backlog will grow in Redis until a worker is available.

**Local dev:** With `docker compose up -d` (Postgres, Redis, MinIO), set storage env vars from `.env.example`, then run `pnpm dev` or `pnpm worker:dev` in a separate terminal.

### Merchant auth hardening (Phase 9F)

- **Session invalidation:** Tokens carry `sessionVersion` from `merchant_users.session_version`. Password change, owner password reset, and deactivation increment the version so older tokens receive `401 SESSION_REVOKED`.
- **Login lockout:** Failed sign-ins per email + IP are counted in Redis when `REDIS_URL` is set; otherwise each API process keeps its own in-memory counters (same fallback model as rate limits). Tune `AUTH_MAX_FAILED_ATTEMPTS`, `AUTH_LOCKOUT_WINDOW_MS`, and `AUTH_LOCKOUT_DURATION_MS`.
- **Operations:** Run Redis in multi-instance staging/production so lockout and rate limits are shared. After Redis loss, lockout resets per process until Redis returns.

### Request IDs and logging

Every API response includes `X-Request-Id`. Clients may send `X-Request-Id` to correlate logs. Structured JSON request logs include method, path, status, duration, request id, and timestamp (stdout only — no external APM in this phase).

## Building images individually

From the repository root:

```bash
docker build -f apps/api/Dockerfile -t airrand-api .
docker build -f apps/merchant/Dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.staging.example.com \
  -t airrand-merchant .
docker build -f apps/customer/Dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.staging.example.com \
  -t airrand-customer .
docker build -f apps/worker/Dockerfile -t airrand-worker .
```

`NEXT_PUBLIC_*` is embedded at **build time** for Next.js. Rebuild merchant/customer images when the public API URL changes.

## Pre-deploy checklist

- [ ] Postgres reachable; migrations applied
- [ ] Redis reachable; `worker` service running (staging compose) or `pnpm worker:start`
- [ ] Secrets rotated from demo defaults; not committed
- [ ] `CORS_ALLOWED_ORIGINS` lists production/staging browser origins
- [ ] Redis reachable when `REDIS_URL` is set
- [ ] `GET /ready` returns 200 with `checks.database`, `checks.redis`, `checks.secrets` all `ok` (or `redis: skipped` only when Redis is intentionally omitted)
- [ ] `./scripts/smoke-staging.sh` passes
- [ ] Demo password changed or demo seed disabled for non-dev environments

## Operational notes

- **Rate limits** use Redis fixed-window counters when `REDIS_URL` is set. If Redis is down or unreachable, the API **falls back to in-memory limits per process** and logs a one-time JSON warning (`rate_limit_fallback`). Limits are not shared across replicas during fallback.
- **Sessions** are stateless signed tokens; logout clears client storage/cookie but does not require server session store.
- **Redis** is used for distributed rate limiting and realtime event pub/sub (no job queues in this phase).
- **Realtime** uses SSE; merchant clients need a valid session (`Authorization: Bearer`). Customer order SSE is public but scoped to a single order id.

### Troubleshooting

| Symptom | Likely cause | Action |
|---------|----------------|--------|
| `/ready` → `redis: failed` | Redis down or wrong `REDIS_URL` | `docker compose ps`, verify `redis-cli -u $REDIS_URL ping` |
| `/ready` → `redis: skipped` | `REDIS_URL` unset | Set `REDIS_URL` in staging/production |
| `rate_limit_fallback` in logs | Redis unreachable at request time | Restore Redis; limits are per-instance until then |
| `429 rate_limited` under load | Legitimate or abusive traffic | Tune `RATE_LIMIT_*` env vars; scale API with Redis healthy |
| Missing `X-Request-Id` | Old proxy stripping headers | Allow `X-Request-Id` through load balancer |

## Related docs

- [Environment reference](./env-reference.md)
- [Security boundaries](./security-boundaries.md)
- [Architecture](./architecture.md)
