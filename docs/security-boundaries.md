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

## Rate limiting

- **Primary:** Redis fixed-window counters when `REDIS_URL` is configured (shared across API replicas).
- **Fallback:** In-memory per process if Redis is unavailable — logs `rate_limit_fallback` once; limits reset on restart and are not shared across instances during fallback.
- Keyed by client IP (`x-forwarded-for` / `x-real-ip` when present).
- Edge or WAF rate limiting is still recommended for production abuse protection.

Returns `429` with `rate_limited` error code.

## Order identifiers

- **Internal:** UUID primary keys in routes and foreign keys (unchanged).
- **Operational:** immutable `ORD-{n}` references on orders for merchant/customer UI and search. References do not encode payment or wallet semantics.

## Realtime streams (Phase 9C)

- **Merchant SSE** (`GET /merchants/:merchantId/events`) requires staff auth. Payloads may include operational order/product data but never passwords, session tokens, pickup nonces, or QR signing material.
- **Customer order SSE** (`GET /merchants/:merchantId/orders/:orderId/events`) is **public** (no customer auth). Only customer-safe order status fields are published — same boundary as `GET .../status` (no PII, no nonce, no internal tokens).
- Events: `order.created`, `order.status_changed`, `order.pickup_verified`, `product.created`, `product.updated`.
- Redis pub/sub shares events across API replicas when `REDIS_URL` is set; otherwise in-memory only (single-instance).
- Clients fall back to HTTP polling if SSE disconnects.

## Staff lifecycle (Phase 9B / 9E)

- Owners/managers can create staff with a **temporary password** (Argon2-hashed server-side). No email is sent — credentials must be shared manually.
- New staff accounts have `must_change_password` until they set a new password via `POST /auth/merchant/change-password`.
- Owners can **reactivate** inactive staff and **reset passwords** (new temporary password + forced change). Owner accounts cannot be reset through staff management.
- Managers cannot create owners, change roles, deactivate, reactivate, or reset passwords.
- The last active **owner** cannot be deactivated; users cannot deactivate themselves.
- Protected merchant routes return `403 PASSWORD_CHANGE_REQUIRED` until the password is changed (auth `me`, `change-password`, and `logout` remain available).
- `password_hash` is never returned from staff APIs; only safe profile fields are exposed.
- Audit events: `staff.created`, `staff.role_updated`, `staff.deactivated`, `staff.reactivated`, `staff.password_reset`, `staff.password_changed`.
- No email invites, no password-reset tokens, no BullMQ — out-of-band credential sharing only.

## Session invalidation (Phase 9F)

- Stateless HMAC session tokens include `sessionVersion` from `merchant_users.session_version` (starts at **1**).
- On password change, password reset, or deactivation, the server increments `session_version`, invalidating all outstanding tokens for that user without a session table.
- Middleware rejects mismatched versions with `401 SESSION_REVOKED`.
- No refresh-token store yet; re-login issues a token with the current version.

## Login lockout (Phase 9F)

- Failed merchant logins are counted per **email + client IP** inside a sliding window (`AUTH_LOCKOUT_WINDOW_MS`).
- After `AUTH_MAX_FAILED_ATTEMPTS` failures, the account is locked for `AUTH_LOCKOUT_DURATION_MS` with `{ "error": { "code": "account_locked", ... } }` (`429`).
- Counters use **Redis** when `REDIS_URL` is set; otherwise **in-memory per API process** (same fallback pattern as rate limits).
- Successful login clears counters for that email/IP pair.
- Audit: `auth.login_failed`, `auth.account_locked`, `auth.password_changed`, `auth.session_revoked`.

## Authentication limitations (Phase 6A / 9E / 9F)

- No MFA, no email-based password reset, no refresh-token rotation yet.
- Demo seed credentials (`owner@demo-cafe.test` / `ChangeMe123!`) are **local-only** — disable or rotate before any shared staging.
- Session tokens are bearer-equivalent if leaked from `localStorage` until revoked via `session_version`.
- Fine-grained RBAC (`owner` | `manager` | `staff`) is enforced on protected merchant routes (Phase 8B).

## CORS

- Browser calls allowed only from origins in `CORS_ALLOWED_ORIGINS`.
- Misconfiguration blocks legitimate UIs or allows unintended origins — verify per environment.

## Current MVP risks (accepted for staging)

| Risk | Mitigation path |
|------|-----------------|
| Guest order spam | Rate limits; future customer auth or CAPTCHA |
| Temporary staff passwords leaked | Share out of band; rotate hash via DB or recreate user |
| Shared demo password | Rotate seed; remove seed in prod |
| IP spoofing behind proxy | Configure trusted proxy headers carefully |
| Redis outage weakens rate limits and login lockout | Monitor Redis; restore before multi-instance abuse |
| Stolen session token before revocation | Short TTL; increment `session_version` on credential events |
| No encryption at rest for DB | Use managed Postgres with disk encryption |
| Staff session theft (XSS) | CSP, HTTP-only cookie-only mode, short TTL |

## Reporting

For staging handoff, verify:

1. `GET /ready` — database, redis (when configured), secrets
2. `./scripts/smoke-staging.sh` — critical paths
3. Secrets not in git; `.env.staging` gitignored

See [deployment.md](./deployment.md) and [env-reference.md](./env-reference.md).
