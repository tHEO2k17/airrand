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
- Routes continue to use UUID path parameters.

## UI

Merchant and customer surfaces show `reference` instead of truncated UUIDs. Audit logs join orders to display `orderReference` when available.

## Multi-instance

Sequence allocation is database-backed, so references stay unique across API replicas without application-level counters.
