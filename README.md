# airRand

Wallet-less commerce orchestration MVP. Merchants manage products and orders; customers place pickup orders and receive a QR code. **This platform does not handle payments, wallets, or financial custody.**

## Monorepo layout

| Path | Ownership |
|------|-----------|
| `apps/merchant` | Merchant POS / dashboard (Next.js) |
| `apps/customer` | Customer storefront (Next.js) |
| `apps/api` | HTTP API (Hono) |
| `apps/worker` | Background job worker (BullMQ + Redis) |
| `packages/contracts` | Shared Zod schemas and DTO types |
| `packages/jobs` | Queue names, job payloads, Redis helpers |
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

### Background worker (Phase 10A)

Requires Redis (`REDIS_URL` in root `.env`). The worker has **no HTTP API** — it only consumes BullMQ queues.

```bash
pnpm worker:dev    # watch mode
# or after build:
pnpm worker:start
```

Queues (placeholders in this phase): `audit.export.requested`, `notification.placeholder`. Producers are not wired from the API yet.

API probes: `GET http://localhost:3003/health` (liveness), `GET http://localhost:3003/ready` (DB, Redis when configured, secrets). Responses include `X-Request-Id`. The worker does not expose `/health` or `/ready`; see [docs/deployment.md](./docs/deployment.md).

Staging smoke test: `./scripts/smoke-staging.sh`

Sign in to the merchant app with seeded demo staff credentials (see **Merchant authentication**).

### Merchant POS (Phase 7A)

The merchant home route **`/`** is the consolidated **Order Line** console: dark icon sidebar, active order queue, menu grid (Lucide icons, no product images), and a right-hand panel for order details plus catalog summary. Secondary routes (`/products`, `/orders`, `/pickup`, `/audit-logs`) share the same POS shell. Pickup verification stays on **`/pickup`** — the dashboard does not skip QR verification.

### Customer storefront (Phase 7B–8A)

Guest storefront at **`http://localhost:3002`** (orange accent, mobile-first):

- **`/`** — menu with icon product cards, sticky cart summary
- **`/cart`** — quantities, pickup details, **Place Order for Pickup**
- **`/order-confirmation`** — pickup QR, copy token, link to **Track order status**
- **`/order-status`** — read-only order progress (status badge, timeline, items, pickup instructions). Loads merchant/order IDs from session after checkout, or via manual form. Polls the API every ~12 seconds until the order is `picked_up` or `cancelled`.

Wording avoids payment processing: catalog prices and **estimated order value** only; payment is arranged directly with the merchant.

### Order references (operational IDs)

Orders keep an internal **UUID** primary key for APIs and database relations. Staff and customers see a short immutable reference such as **`ORD-1001`** for verbal communication and on-screen display. References are allocated from a database sequence (not derived from UUIDs).

**Realtime (SSE):** Merchant Order Line / Orders use **Server-Sent Events** (`GET /merchants/:merchantId/events`) with automatic **polling fallback** if the stream fails. Customer order status uses `GET /merchants/:merchantId/orders/:orderId/events` (public, customer-safe payloads only). When `REDIS_URL` is set, events fan out across API instances via Redis pub/sub; without Redis, events stay in-process only.

### Responsive layout (Phase 8C)

Design tokens and CSS use a dashboard-inspired card layout (large rounded surfaces, generous spacing, orange accent). No API changes.

| App | Breakpoints |
|-----|-------------|
| **Merchant** (`:3001`) | Tablet+ sidebar stays fixed. Order Line: stacked cards on phone, grid on tablet, horizontal queue on wide desktop; menu + **Current order** rail side-by-side from 1100px. |
| **Customer** (`:3002`) | Mobile-first. Product grid: 1 → 2 → 3 → 4 columns. Cart splits into two columns on desktop. Confirmation and order-status pages use a centered flow layout on large screens. |

### End-to-end demo flow

1. **Customer** (`:3002`): browse menu → add to cart → **Place Order for Pickup** → **Show Pickup Code** on confirmation → **Track order status** to watch progress.
2. **Merchant** (`:3001`): sign in → use Order Line (`/`) or Orders (auto-refresh ~10s, manual **Refresh**) → Accept → Mark ready.
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
| `AUTH_MAX_FAILED_ATTEMPTS` | `5` | Failed logins before lockout (per email + IP) |
| `AUTH_LOCKOUT_WINDOW_MS` | `900000` (15 min) | Window to count failures |
| `AUTH_LOCKOUT_DURATION_MS` | `900000` (15 min) | Lockout duration after threshold |

Sessions embed `sessionVersion` from the database. Password change, password reset, and deactivation increment `session_version` and invalidate older tokens (`401 SESSION_REVOKED`). Login lockout uses Redis when available, otherwise in-memory per API process.

**Local demo credentials only** (from `pnpm db:seed`). All use password `ChangeMe123!`:

| Role | Email |
|------|-------|
| Owner | `owner@demo-cafe.test` |
| Manager | `manager@demo-cafe.test` |
| Staff | `staff@demo-cafe.test` |

### Merchant roles (Phase 8B)

| Action | Owner | Manager | Staff |
|--------|:-----:|:-------:|:-----:|
| Create / update products, toggle availability | Yes | Yes | No |
| View orders | Yes | Yes | Yes |
| Update order status | Yes | Yes | Yes |
| Verify pickup | Yes | Yes | Yes |
| View audit logs | Yes | Yes | No |
| View staff list | Yes | Yes | No |
| Create staff | Yes | Yes (staff only) | No |
| Update staff roles | Yes | No | No |
| Deactivate staff | Yes | No | No |
| Reactivate staff | Yes | No | No |
| Reset staff password | Yes | No | No |

The API returns `403` with `{ "error": { "code": "forbidden", "message": "You do not have permission to perform this action." } }` when a role is not allowed. The merchant UI hides or disables controls staff cannot use (for example, product edits, Staff, and the Audit nav item).

### Staff management (Phase 9B / 9E)

Owners and managers can open **Staff** (`/staff`) to list accounts. Owners may create **manager** or **staff** users; managers may create **staff** only. New accounts receive a **temporary password** you must share out of band — there is no email delivery yet.

- New staff must **change password on first sign-in** (`mustChangePassword`).
- Owners can change roles (manager ↔ staff), deactivate, **reactivate**, and **reset passwords** (sets a new temporary password + forced change).
- Managers cannot change roles, deactivate, reactivate, or reset passwords.
- You cannot deactivate yourself or the last active **owner**. Owner passwords cannot be reset via staff management.
- Any signed-in user can change their own password at **Change password** (`/change-password`).
- Demo seed passwords remain for local use only; rotate or disable before shared staging.

Protected API: `GET/POST /merchants/:merchantId/staff`, `PATCH .../role`, `POST .../deactivate`, `POST .../reactivate`, `POST .../reset-password`, `POST /auth/merchant/change-password`.

The merchant app stores the session token in `localStorage` and sends `Authorization: Bearer …` on protected API calls. The API also sets an HttpOnly `airrand_session` cookie on login for same-site deployments.

### API routes

| Access | Routes |
|--------|--------|
| Public | `GET /health`, `GET /merchants`, `GET /merchants/:id/products`, `POST /merchants/:id/orders`, `GET /merchants/:merchantId/orders/:orderId/status`, `GET /merchants/:merchantId/orders/:orderId/events`, `POST /auth/merchant/login` |
| Protected (merchant staff) | `POST /auth/merchant/logout`, `GET /auth/merchant/me`, `POST /auth/merchant/change-password`, product mutations, `GET /orders`, order status/pickup, `GET /audit-logs`, staff management, `GET /merchants/:merchantId/events` (SSE) |

Customer guest ordering stays public on catalog and order create.

## Rate limiting (Phase 5B / 9A)

Distributed limits via **Redis** when `REDIS_URL` is set (`docker compose` provides Redis on port `6379`). If Redis is unavailable, the API falls back to **in-memory per-process** limits and logs a warning.

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | `redis://localhost:6379` (example) | Redis for shared counters |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Fixed window length |
| `RATE_LIMIT_MAX_READS` | `120` | GET (and other reads) per window |
| `RATE_LIMIT_MAX_MUTATIONS` | `30` | POST/PATCH/PUT/DELETE per window |

Returns `429` with `{ "error": { "code": "rate_limited", ... } }`. See [deployment.md](./docs/deployment.md) for fallback behavior and troubleshooting.

## Merchant pickup scan (Phase 5B)

On **Pickup** (`/pickup`), the merchant app can scan a customer QR with the device camera (`html5-qrcode`) or paste the token manually. Client-side decoding is only used to route to the correct order; the server verifies the signature.

## Local database (Docker)

PostgreSQL runs in Docker on host port **5433** (container `5432`) to avoid clashing with a system Postgres on `5432`. `DATABASE_URL` in `.env.example` matches this setup.

```bash
# Start Postgres + Redis (detached)
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
- [Order references](./docs/order-references.md)
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
- **Phase 6B**: Staging deployment docs, Docker, readiness, CORS env
- **Phase 7A**: Merchant POS UI refactor
- **Phase 7B**: Customer storefront polish
- **Phase 8A–8C**: Order status polling, merchant RBAC, responsive layout
- **Phase 9A**: Redis rate limits, request IDs, structured logging, readiness (DB/Redis/secrets)
- **Phase 9B**: Merchant staff lifecycle (create, role update, deactivate)
- **Phase 9E**: Merchant account lifecycle (forced password change, reactivate, owner password reset)
- **Phase 9F**: Session invalidation (`session_version`) and login lockout
- **Phase 10A**: BullMQ worker foundation (`apps/worker`, placeholder queues)
- **Phase 9C**: SSE realtime (merchant + customer order streams, Redis pub/sub)
- **Phase 9D**: Human-friendly order references (`ORD-1001`, sequence-backed)
