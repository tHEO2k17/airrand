# airRand

Wallet-less commerce orchestration MVP. Merchants manage products and orders; customers place pickup orders and receive a QR code. **This platform does not handle payments, wallets, or financial custody.**

## Monorepo layout

| Path | Ownership |
|------|-----------|
| `apps/merchant` | Merchant POS / dashboard (Next.js) |
| `apps/customer` | Customer storefront (Next.js) |
| `apps/api` | HTTP API (Hono) |
| `packages/contracts` | Shared Zod schemas and DTO types |
| `packages/domain` | Order status rules and invariants |
| `packages/database` | Schema, migrations, DB client |
| `packages/qr` | Pickup token sign/verify |
| `packages/config` | Shared TypeScript and ESLint config |

See [docs/architecture.md](./docs/architecture.md), [docs/deployment.md](./docs/deployment.md), [docs/env-reference.md](./docs/env-reference.md), and [docs/adr/0001-walletless-mvp.md](./docs/adr/0001-walletless-mvp.md).

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) (for local PostgreSQL)

## Setup

```bash
# Install dependencies
corepack enable && corepack prepare pnpm@9.15.9 --activate
pnpm install

# Copy environment template (set QR_SIGNING_SECRET to at least 32 characters)
cp .env.example .env

# Start local PostgreSQL (port 5433 on host)
docker compose up -d

# Wait until healthy, then migrate and seed
pnpm db:migrate
pnpm db:seed

# Build all packages and apps
pnpm build

# Verify
pnpm typecheck
pnpm lint
pnpm test
```

## Development

### Environment

Root `.env` powers the API and database scripts. Each Next.js app needs its own env file:

```bash
cp apps/merchant/.env.example apps/merchant/.env.local
cp apps/customer/.env.example apps/customer/.env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
```

### Run services

Start Postgres if needed (`docker compose up -d`), then:

```bash
pnpm --filter @airrand/api dev        # http://localhost:3003
pnpm --filter @airrand/merchant dev   # http://localhost:3001
pnpm --filter @airrand/customer dev   # http://localhost:3002
```

Or all apps:

```bash
pnpm dev
```

API probes: `GET http://localhost:3003/health` (liveness), `GET http://localhost:3003/ready` (DB + secrets)

Staging smoke test: `./scripts/smoke-staging.sh`

Both web apps load the seeded **Demo Cafe** merchant (`demo-cafe`) automatically.

### End-to-end demo flow

1. **Customer** (`:3002`): browse menu → add to cart → place pickup order → show QR/token on confirmation.
2. **Merchant** (`:3001`): see order on Orders → Accept → Mark ready.
3. **Merchant** Pickup screen: paste token (or scan later) → verify → order becomes `picked_up`.

Payment happens outside airRand; the apps only coordinate reservation and pickup verification.

## CI

GitHub Actions runs on every push to `main` and on pull requests:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Workflow: [.github/workflows/ci.yml](./.github/workflows/ci.yml)

## Audit log (Phase 5A)

Order lifecycle events are recorded in `audit_logs`:

- `order.created` (customer actor when name provided)
- `order.status_changed`
- `order.pickup_verified`

Merchant UI: **Audit log** screen (`/audit-logs`) or `GET /merchants/:merchantId/audit-logs`.

Merchant staff actions record `merchant_staff` with the staff email as `actor_label`.

## Merchant authentication (Phase 6A)

Staff sign in at the merchant app **/login**. Sessions use HMAC-signed tokens (Argon2 password hashes).

| Variable | Default | Purpose |
|----------|---------|---------|
| `AUTH_SESSION_SECRET` | (required, ≥32 chars) | Signs session tokens |
| `AUTH_SESSION_TTL_MS` | `604800000` (7 days) | Session lifetime |

**Local demo credentials only** (from `pnpm db:seed`):

| Field | Value |
|-------|-------|
| Email | `owner@demo-cafe.test` |
| Password | `ChangeMe123!` |

The merchant app stores the session token in `localStorage` and sends `Authorization: Bearer …` on protected API calls. The API also sets an HttpOnly `airrand_session` cookie on login for same-site deployments.

### API routes

| Access | Routes |
|--------|--------|
| Public | `GET /health`, `GET /merchants`, `GET /merchants/:id/products`, `POST /merchants/:id/orders`, `POST /auth/merchant/login` |
| Protected (merchant staff) | `POST /auth/merchant/logout`, `GET /auth/merchant/me`, product mutations, `GET /orders`, order status/pickup, `GET /audit-logs` |

Customer guest ordering stays public on catalog and order create.

## Rate limiting (Phase 5B)

The API applies in-memory per-IP limits (no Redis):

| Variable | Default | Purpose |
|----------|---------|---------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Fixed window length |
| `RATE_LIMIT_MAX_READS` | `120` | GET (and other reads) per window |
| `RATE_LIMIT_MAX_MUTATIONS` | `30` | POST/PATCH/PUT/DELETE per window |

Returns `429` with `{ "error": { "code": "rate_limited", ... } }`.

## Merchant pickup scan (Phase 5B)

On **Pickup** (`/pickup`), the merchant app can scan a customer QR with the device camera (`html5-qrcode`) or paste the token manually. Client-side decoding is only used to route to the correct order; the server verifies the signature.

## Local database (Docker)

PostgreSQL runs in Docker on host port **5433** (container `5432`) to avoid clashing with a system Postgres on `5432`. `DATABASE_URL` in `.env.example` matches this setup.

```bash
# Start Postgres (detached)
docker compose up -d

# Check status
docker compose ps

# Apply schema and seed demo data
pnpm db:migrate
pnpm db:seed

# Stop Postgres (keeps data in the named volume)
docker compose down

# Stop and remove data volume (full reset)
docker compose down -v
```

If you change `DATABASE_URL`, ensure it matches the Docker port (`5433`) unless you use your own Postgres instance.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all workspaces via Turborepo |
| `pnpm dev` | Start dev servers |
| `pnpm lint` | ESLint across workspaces |
| `pnpm typecheck` | TypeScript check across workspaces |
| `pnpm test` | Run unit tests |
| `pnpm db:generate` | Generate Drizzle migrations from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed demo merchant and products |
| `pnpm clean` | Remove build artifacts |

## MVP boundaries

In scope: merchants, products, customer orders, order status, QR pickup verification.

Out of scope: payments, wallets, balances, ledgers, settlements, payment intents, financial custody.

## Documentation

- [Architecture](./docs/architecture.md)
- [Order lifecycle](./docs/order-lifecycle.md)
- [ADR 0001: Wallet-less MVP](./docs/adr/0001-walletless-mvp.md)

## Implementation phases

- **Phase 0**: Repo scaffold
- **Phase 1**: Database schema, contracts, domain rules, API
- **Phase 1.5**: Local Docker PostgreSQL
- **Phase 2**: QR pickup token issue/verify
- **Phase 3**: Merchant UI
- **Phase 4**: Customer UI
- **Phase 5A**: CI + audit log
- **Phase 5B**: Rate limiting + camera QR scan
- **Phase 6A**: Merchant staff authentication
- **Phase 6B** (current): Staging deployment docs, Docker, readiness, CORS env
