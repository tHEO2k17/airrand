# Security boundaries (MVP)

This document states what airRand **does and does not** protect in the current MVP. Use it for staging handoff and risk review.

## Wallet-less product boundary

airRand is **commerce orchestration only**:

- Merchants manage catalog and orders.
- Customers place pickup orders and receive a QR/token.
- **No payments, wallets, balances, ledgers, settlements, payment intents, checkout providers, or financial custody** are implemented or implied.

Any payment happens **outside** this platform. Do not store card data, bank details, or “balance” fields in this codebase.

## No financial custody

The API and apps must not:

- Hold customer or merchant funds
- Execute or route money movement
- Present stored-value or wallet semantics

Order records describe **fulfillment state** (`placed` → `picked_up`), not payment state.

## Public vs protected API surface

### Public (guest / customer flow)

No merchant staff session required:

| Route | Risk note |
|-------|-----------|
| `GET /health`, `GET /ready` | Operational; no business data |
| `GET /merchants` | Lists merchants (MVP: small set / demo) |
| `GET /merchants/:id/products` | Catalog read |
| `POST /merchants/:id/orders` | **Creates orders** — rate-limited; no customer auth yet |
| `POST /auth/merchant/login` | Credential guessing — rate-limited |

Customer ordering intentionally stays guest-based in this phase.

### Protected (merchant staff)

Require valid session (`Authorization: Bearer` or `airrand_session` cookie):

- Product create/update
- Order list, status changes, pickup verify
- Audit log read
- `GET /auth/merchant/me`

Middleware enforces `session.merchantId === route :merchantId`.

## QR pickup token trust model

- Tokens are **HMAC-signed** server-side (`QR_SIGNING_SECRET`).
- Payload includes `orderId`, `merchantId`, expiry, nonce.
- **Client decode is not trusted** — merchant UI may decode for routing only; `POST .../pickup/verify` re-verifies signature, expiry, and order state.
- Compromise of `QR_SIGNING_SECRET` allows forging pickup tokens — rotate secret and treat like a signing key.

## Audit logging

- Actions: `order.created`, `order.status_changed`, `order.pickup_verified`.
- Actors: `customer` (name label), `merchant_staff` (email), or `unknown` when not applicable.
- Audit logs are **not authenticated for customers**; only merchant staff can read via protected API.
- Logs are not tamper-evident (no hash chain) in MVP.

## Rate limiting limitations

- **In-memory**, per API process, keyed by IP (with `x-forwarded-for` / `x-real-ip` when present).
- Resets on process restart; not shared across replicas.
- Appropriate for single-instance staging; **insufficient alone for high-traffic or multi-instance production** without Redis or edge rate limiting.

Returns `429` with `rate_limited` error code.

## Authentication limitations (Phase 6A)

- No MFA, no account lockout beyond rate limits, no password reset flow.
- Demo seed credentials (`owner@demo-cafe.test` / `ChangeMe123!`) are **local-only** — disable or rotate before any shared staging.
- Session tokens are bearer-equivalent if leaked from `localStorage`.
- Role field (`owner` | `manager` | `staff`) is stored but **not enforced** for fine-grained RBAC in MVP.

## CORS

- Browser calls allowed only from origins in `CORS_ALLOWED_ORIGINS`.
- Misconfiguration blocks legitimate UIs or allows unintended origins — verify per environment.

## Current MVP risks (accepted for staging)

| Risk | Mitigation path |
|------|-----------------|
| Guest order spam | Rate limits; future customer auth or CAPTCHA |
| Shared demo password | Rotate seed; remove seed in prod |
| IP spoofing behind proxy | Configure trusted proxy headers carefully |
| Single-node rate limits | Redis / edge limits in later phase |
| No encryption at rest for DB | Use managed Postgres with disk encryption |
| Staff session theft (XSS) | CSP, HTTP-only cookie-only mode, short TTL |

## Reporting

For staging handoff, verify:

1. `GET /ready` — database + secrets
2. `./scripts/smoke-staging.sh` — critical paths
3. Secrets not in git; `.env.staging` gitignored

See [deployment.md](./deployment.md) and [env-reference.md](./env-reference.md).
