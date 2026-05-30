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

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Build all packages and apps
pnpm build

# Run typecheck and lint
pnpm typecheck
pnpm lint
```

## Development

Run all apps in parallel:

```bash
pnpm dev
```

Or run individually:

```bash
pnpm --filter @airrand/merchant dev   # http://localhost:3001
pnpm --filter @airrand/customer dev   # http://localhost:3002
pnpm --filter @airrand/api dev        # http://localhost:3003
```

API health check: `GET http://localhost:3003/health`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all workspaces via Turborepo |
| `pnpm dev` | Start dev servers |
| `pnpm lint` | ESLint across workspaces |
| `pnpm typecheck` | TypeScript check across workspaces |
| `pnpm clean` | Remove build artifacts |

## MVP boundaries

In scope: merchants, products, customer orders, order status, QR pickup verification.

Out of scope: payments, wallets, balances, ledgers, settlements, payment intents, financial custody.

## Documentation

- [Architecture](./docs/architecture.md)
- [Order lifecycle](./docs/order-lifecycle.md)
- [ADR 0001: Wallet-less MVP](./docs/adr/0001-walletless-mvp.md)

## Implementation phases

- **Phase 0** (current): Repo scaffold
- **Phase 1**: Database schema, contracts, domain rules, API skeleton
- **Phase 2**: QR pickup token issue/verify
- **Phase 3**: Merchant UI
- **Phase 4**: Customer UI
