# ADR 0001: Wallet-less MVP scope

## Status

Accepted

## Context

airRand is a commerce **orchestration** product: connect merchant catalog, customer orders, and pickup verification. Stakeholders may later ask for in-app payments; doing so early increases regulatory, security, and product surface area.

## Decision

The MVP will **not** implement:

- Payment processing or payment provider integrations
- Wallets, stored value, or balances
- Ledgers, settlements, or financial custody
- Payment intents, checkout sessions, or refund automation
- Database tables or API fields named for money movement (e.g. `wallet`, `ledger`, `payment_intent`)

The MVP **will** implement:

- Merchants and merchant staff access
- Products (merchant-scoped)
- Customer orders and line items
- Order status lifecycle (see [order-lifecycle.md](../order-lifecycle.md))
- QR pickup token issue and verification

## Consequences

### Positive

- Smaller attack surface and compliance scope
- Faster time to validate pickup workflow
- Clear domain language (orders, not transactions)

### Negative

- Merchants must collect payment offline or via separate tools
- No unified receipt for payment + pickup in v1

### Guardrails

- New ADR required before any payment or wallet feature
- PR review checklist: reject schemas/routes containing payment custody concepts
- Optional future field: `external_reference` (string) for merchant notes — not a payment processor ID in MVP

## References

- [architecture.md](../architecture.md)
- [order-lifecycle.md](../order-lifecycle.md)
