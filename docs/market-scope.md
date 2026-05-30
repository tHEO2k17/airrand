# Market scope and product positioning

This document defines **who airRand serves**, **what problem it solves**, and **what is in scope for the current MVP** versus future phases. It is the canonical reference for market and vendor positioning.

## Product positioning

airRand is a **wallet-less commerce and pickup coordination platform**.

It helps **customers** order ahead, reserve items, request pickup, and reduce waiting time.

It helps **merchants and verified vendors** manage incoming orders, availability, pickup verification, and operational flow.

Payment is arranged **outside** the platform. airRand coordinates fulfillment and pickup — not money movement, wallets, or financial custody.

## Target users (customers)

Primary customer segments:

| Segment | Why airRand fits |
|---------|------------------|
| **Busy office workers** | Order ahead during the day; pick up on the way home without queuing |
| **Students** | Reserve items between classes; track status on mobile |
| **Mobile phone users with internet access** | Mobile-first storefront; QR pickup codes; order status without an account (MVP) |

Customer UX assumptions:

- Mobile-first browsing and checkout
- **Guest-first — no sign-up or login** (intentional product decision for speed)
- Phone number at checkout as **lightweight identity** for merchant contact and future OTP
- Short path from catalog → cart → pickup confirmation
- Real-time or polled order status via merchant + order reference
- No in-app payment — prices are informational; settlement is direct with the vendor

Designed for low-friction commerce behavior (including mobile-first African markets): minimize steps, avoid account walls, preserve operational traceability for merchants.

**UX consistency:** Customer and merchant apps share the orange accent (`#f97316`), neutral operational surfaces, and semantic alert colors. Operational notifications (Phase 10D) reuse this system — no separate notification brand. See [design-system.md](./design-system.md).

## Target vendors

airRand serves small and mid-volume pickup-oriented businesses and operators.

### Standard merchants (MVP — implemented)

These vendor types use the current **merchant** model: catalog, staff accounts, order queue, pickup verification, audit log.

| Vendor type | Typical use |
|-------------|-------------|
| **Convenience stores** | Snacks, drinks, essentials — quick pickup |
| **Pharmacies** | Reserved prescriptions or OTC items (operational pickup only; no clinical claims in MVP) |
| **Laundry services** | Order drop-off/pickup slots; status tracking |
| **Small retail shops** | General retail with limited SKU count |

MVP onboarding for standard merchants: owner/manager staff account, product catalog, POS-style order line. No marketplace-wide vetting beyond tenant isolation.

### Verified “plugs” (future — not implemented)

**Plugs** are a distinct **future vendor type**: individuals or small operators who fulfill **pickup or errand-style requests** (for example personal shopper, proxy pickup, last-mile handoff to a fixed meeting point).

Plugs are **not** the same as standard merchants:

| Dimension | Standard merchant | Plug (future) |
|-----------|-------------------|---------------|
| Onboarding | Staff signup + catalog setup | **Stricter verification** (identity, reputation, manual or automated review) |
| Catalog | Fixed product list | May be request-based or dynamic offerings |
| Trust model | Business location + staff RBAC | **Higher trust bar** — verified identity, possible background checks, tiered access |
| Fulfillment | In-store pickup | Pickup **or** errand-style coordination (still **no delivery logistics in MVP roadmap**) |

**Do not implement plug onboarding, plug-specific APIs, or plug verification flows until a dedicated phase.** Document only.

When plugs ship, expect:

- Separate onboarding workflow and approval state
- Stronger audit and dispute hooks
- Possible customer identity or order limits
- Security review before any “verified plug” badge is shown to customers

## What the MVP delivers today

The current codebase focuses on **standard merchants** only:

- Merchant catalog (products, **categories**, lightweight **stock state**, boolean availability)
- **Guest-first** customer ordering (phone at checkout, no accounts)
- Order lifecycle (`placed` → `ready` → `picked_up` / `cancelled`)
- QR / token pickup verification
- Merchant staff authentication, RBAC, and lifecycle
- Audit log and CSV export (background worker)
- Realtime order updates (SSE + polling fallback)

See [architecture.md](./architecture.md) and [security-boundaries.md](./security-boundaries.md) for technical boundaries.

## Explicitly deferred (not in MVP)

| Area | Notes |
|------|--------|
| **Payments, wallets, balances, ledgers** | Permanent product boundary — see [ADR 0001](./adr/0001-walletless-mvp.md) |
| **Plug onboarding and verification** | Future vendor type; stricter than merchant signup |
| **Delivery logistics** | No couriers, routes, or driver apps |
| **Customer accounts** | Guest-first only; sign-up intentionally excluded |
| **Customer OTP / phone verification** | Future optional layer — not MVP |
| **Saved payment methods** | Out of scope (wallet-less) |
| **Loyalty, recommendations, customer analytics, advertising** | Explicitly deferred |
| **Multi-merchant cart** | One merchant per checkout |
| **Marketplace discovery / ratings** | No plug or merchant reputation system yet |
| **Email / SMS notifications** | Operational placeholder jobs only (Phase 10D); no providers yet |
| **Durable object storage for exports** | Shipped in Phase 10E (MinIO local; S3-compatible in production) |
| **Product categories & stock state** | Shipped in Phase 11A (lightweight; not ERP inventory) |
| **Pharmacy prescription workflow** | Deferred — OTC/catalog grouping only in 11A |
| **Laundry service workflow** | Deferred — category placeholder only (e.g. Laundry Services) |

## Roadmap alignment (product phases)

Phases already shipped (0–11A) built the **standard merchant pickup stack**. Upcoming product directions (documentation only — not committed scope):

| Phase (conceptual) | Focus |
|--------------------|--------|
| **10D** | Operational notification jobs (placeholder SMS/email; no providers) |
| **10E** | Durable export storage (MinIO / S3-compatible via `@airrand/storage`) |
| **11A** | Product categories and stock state for retail/convenience/OTC basics |
| **11+** | Optional customer OTP; optional accounts (guest remains default); improved discovery |
| **12+** | **Plug vendor type** — verification, onboarding, plug-specific policies |
| **13+** | Delivery or errand logistics (only after pickup MVP is stable) |

Prioritize **merchant catalog, orders, pickup verification, staff management, and auditability** until standard-merchant flows are production-ready across target verticals (convenience, pharmacy pickup desk, laundry counter, small retail).

## Vertical notes (non-binding)

These are **positioning hints** for GTM and UX copy — not separate product modules in MVP:

- **Pharmacy:** Emphasize reservation and pickup timing; avoid medical advice or payment for regulated products in-app.
- **Laundry:** Order reference + status may map to “ready for collection” workflows.
- **Convenience / retail:** Fast catalog browse and Order Line throughput matter most.

## Related docs

- [Customer data policy](./customer-data-policy.md) — guest-first, phone identity, retention
- [Customer data policy](./customer-data-policy.md) — guest-first, phone identity, retention
- [Architecture](./architecture.md) — system design and non-goals
- [Security boundaries](./security-boundaries.md) — trust model and MVP limits
- [ADR 0001: Wallet-less MVP](./adr/0001-walletless-mvp.md) — no financial custody
