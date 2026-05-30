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

See [docs/architecture.md](./docs/architecture.md) and [docs/adr/0001-walletless-mvp.md](./docs/adr/0001-walletless-mvp.md).

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

API health check: `GET http://localhost:3003/health`

Both web apps load the seeded **Demo Cafe** merchant (`demo-cafe`) automatically.

### End-to-end demo flow

1. **Customer** (`:3002`): browse menu → add to cart → place pickup order → show QR/token on confirmation.
2. **Merchant** (`:3001`): see order on Orders → Accept → Mark ready.
3. **Merchant** Pickup screen: paste token (or scan later) → verify → order becomes `picked_up`.

Payment happens outside airRand; the apps only coordinate reservation and pickup verification.

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
- **Phase 4** (current): Customer UI
