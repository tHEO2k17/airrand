# Customer data policy

This document defines how airRand treats **guest customer data** in the MVP: what we collect, why, how long it may be kept, and what we explicitly do not do with it.

See also [market-scope.md](./market-scope.md) and [security-boundaries.md](./security-boundaries.md).

## Product decision: guest-first, no accounts

**Customer accounts and sign-up are intentionally excluded from the MVP.**

This is a deliberate product choice aligned with low-friction commerce — especially mobile-first markets where speed and accessibility matter more than persistent login.

| Principle | MVP behavior |
|-----------|--------------|
| No customer sign-up | No passwords, sessions, or profile pages for shoppers |
| No customer auth API | Public order create and status endpoints only |
| Lightweight identity | **Phone number** (`customer_contact`) is the primary operational identifier |
| Optional display name | `customer_name` is optional and lightweight (first name or nickname) |

Accounts, OTP verification, and saved profiles may be added **later as optional enhancements** — guest ordering remains the default path.

## What we collect (operational only)

On order create, the customer may provide:

| Field | Required (product target) | Purpose |
|-------|---------------------------|---------|
| `customer_contact` | **Yes** — valid phone number | Merchant callback, pickup coordination, future OTP context |
| `customer_name` | No | Display on merchant order line; audit actor label when present |
| `notes` | No | Pickup or item instructions |

Phone numbers are **operational contact data**, not marketing identifiers. They exist to fulfill a specific order at a specific merchant.

**MVP implementation:** `customer_contact` is **required** on order create with minimal phone format validation (`@airrand/domain` `isValidCustomerPhone`). `customer_name` remains optional.

## What we do not collect or use data for

Customer data is **not intended for long-term profiling**. Explicitly out of scope:

- Customer accounts or credential stores
- Saved payment methods
- Loyalty points or tiers
- Recommendation engines
- Customer analytics dashboards or behavioral profiling
- Advertising or retargeting systems
- Cross-merchant customer identity graphs

Merchants see contact details **only for their own orders**. The platform does not build a unified “customer CRM” across tenants in MVP.

## Retention and minimization

**Policy (target):**

- Customer fields on orders are kept only as long as needed for **active fulfillment and merchant operations**.
- After an order reaches a terminal state (`picked_up` or `cancelled`) and any dispute window passes, **customer name and phone may be purged or anonymized automatically**.
- Order reference, merchant scope, line items, status history, and audit events may be retained longer for merchant accountability — with PII stripped where feasible.

**MVP implementation:** automatic purge jobs are **not required yet**. Document the policy now; implement retention workers in a future phase when legal/commercial retention periods are defined.

When purge ships, prefer:

- Nulling `customer_name` and `customer_contact` on the order row, or
- Replacing phone with a one-way hash for dedupe/rate-limit only (no reversible storage)

Never retain phone numbers solely for marketing.

## Order tracking without accounts

Customers track orders using:

1. **Merchant identifier** — which shop the order belongs to
2. **Order reference** — e.g. `ORD-1001` (operational label, not a secret)
3. **Session context** — browser session storage after checkout (order UUID for API/SSE)
4. **Phone verification context (future)** — optional OTP to prove access to status for a given reference + merchant pair

Tracking does **not** require login. Future OTP would add proof-of-possession for phone without creating a full account.

## African commerce context

Guest-first ordering reflects common patterns:

- Mobile money and cash settlement happen **outside** the app
- Users expect to order quickly with a phone number they already use daily
- Sign-up friction reduces conversion for repeat convenience purchases
- Trust is operational (merchant knows who to call, customer has reference + QR) rather than account-based

airRand optimizes for **speed and accessibility** while preserving merchant-side traceability through order references, audit logs, and staff-visible contact fields.

## Related docs

- [Architecture — customer flow](./architecture.md#customer-flow-guest-first)
- [Order references](./order-references.md)
- [Security boundaries — customer tracking](./security-boundaries.md#customer-order-tracking-guest-first)
