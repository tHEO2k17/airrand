# Deployment guide

This document describes how to run airRand in a **staging-style** environment using Docker. It does not cover payment processing — airRand remains wallet-less with no financial custody.

## What you deploy

| Service | Port (example) | Dockerfile |
|---------|----------------|------------|
| PostgreSQL | 5432 (internal) | `postgres:16-alpine` (compose) |
| API (Hono) | 3003 | `apps/api/Dockerfile` |
| Merchant UI (Next.js) | 3001 | `apps/merchant/Dockerfile` |
| Customer UI (Next.js) | 3002 | `apps/customer/Dockerfile` |

## Prerequisites

- Docker and Docker Compose
- Node 20+ and pnpm (for local builds and migrations outside Docker)
- Secrets: `AUTH_SESSION_SECRET`, `QR_SIGNING_SECRET` (each ≥32 characters)

See [env-reference.md](./env-reference.md) for the full variable list.

## Local development (unchanged)

```bash
docker compose up -d          # Postgres on host port 5433
cp .env.example .env          # set secrets
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
| `GET /ready` | Readiness — DB + secrets | `200` when DB reachable and secrets valid; `503` otherwise |

Orchestrators should use `/health` for liveness and `/ready` for traffic routing after deploy.

Readiness checks:

- **database** — `SELECT 1` via Drizzle
- **secrets** — `AUTH_SESSION_SECRET` and `QR_SIGNING_SECRET` present and ≥32 characters

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
```

`NEXT_PUBLIC_*` is embedded at **build time** for Next.js. Rebuild merchant/customer images when the public API URL changes.

## Pre-deploy checklist

- [ ] Postgres reachable; migrations applied
- [ ] Secrets rotated from demo defaults; not committed
- [ ] `CORS_ALLOWED_ORIGINS` lists production/staging browser origins
- [ ] `GET /ready` returns 200
- [ ] `./scripts/smoke-staging.sh` passes
- [ ] Demo password changed or demo seed disabled for non-dev environments

## Operational notes

- **Rate limits** are in-memory per API instance; scale-out does not share counters yet.
- **Sessions** are stateless signed tokens; logout clears client storage/cookie but does not require server session store.
- **No Redis** in this phase — add in a later phase for shared rate limits if needed.

## Related docs

- [Environment reference](./env-reference.md)
- [Security boundaries](./security-boundaries.md)
- [Architecture](./architecture.md)
