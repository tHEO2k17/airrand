# Order references

airRand uses two identifiers for orders:

| Identifier | Example | Purpose |
|------------|---------|---------|
| UUID (`orders.id`) | `550e8400-e29b-…` | Primary key, API routes, foreign keys, realtime channels |
| Reference (`orders.reference`) | `ORD-1001` | Human-friendly display, search, verbal communication |

## Generation

- PostgreSQL sequence: `order_reference_seq` (starts at **1001**).
- Format: `ORD-{sequence}` via `@airrand/domain` `formatOrderReference`.
- Assigned atomically on order create with `nextval` inside the same transaction.
- **Immutable** after insert; UUID remains the internal identifier.

## API

- All order responses include `reference`.
- `GET /merchants/:merchantId/orders?reference=ORD-1001` (numeric `1001` is normalized).
- `GET /merchants/:merchantId/orders/by-reference/:reference/status` — public customer status lookup by reference (UUID path still supported).
- Routes continue to use UUID path parameters for mutations and realtime.

## UI

Merchant and customer surfaces show `reference` instead of truncated UUIDs. The customer order-status page looks up by reference; UUIDs stay in session storage for API/SSE only. Audit logs join orders to display `orderReference` when available.

## Customer tracking (guest-first)

Customers track orders without accounts using:

| Key | Purpose |
|-----|---------|
| **Merchant ID** | Scopes lookup to one vendor |
| **Order reference** | Human-friendly search key (e.g. `ORD-1001`) |
| **Session order UUID** | Post-checkout convenience in browser storage |
| **Phone (future OTP)** | Optional proof-of-possession — not MVP |

References are **operational labels, not authentication secrets**. Status APIs must remain merchant-scoped; knowing a reference must not reveal unrelated orders. Phone alone must not list orders across merchants.

See [customer-data-policy.md](./customer-data-policy.md) and [security-boundaries.md](./security-boundaries.md#customer-order-tracking-guest-first).

## Multi-instance

Sequence allocation is database-backed, so references stay unique across API replicas without application-level counters.
