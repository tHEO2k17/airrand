# Environment variable reference

airRand uses a **root `.env`** for the API and database tooling. Each Next.js app has **`apps/<app>/.env.local`** for browser-facing values.

Generate secrets with at least **32 random characters** (for example `openssl rand -base64 48`).

---

## Root / API (`/.env`)

Used by `apps/api`, `pnpm db:*`, and Docker API containers.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5433/airrand` | PostgreSQL connection string |
| `PORT` | No | `3003` | API listen port |
| `AUTH_SESSION_SECRET` | Yes | — | HMAC secret for merchant session tokens (≥32 chars) |
| `AUTH_SESSION_TTL_MS` | No | `604800000` (7 days) | Merchant session lifetime in milliseconds |
| `QR_SIGNING_SECRET` | Yes | — | HMAC secret for pickup QR tokens (≥32 chars) |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (ms), in-memory per API process |
| `RATE_LIMIT_MAX_READS` | No | `120` | Max GET (read) requests per IP per window |
| `RATE_LIMIT_MAX_MUTATIONS` | No | `30` | Max POST/PATCH/etc. per IP per window |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3001,http://localhost:3002` | Comma-separated browser origins allowed to call the API |

### Deprecated / optional (documentation only)

| Variable | Notes |
|----------|--------|
| `MERCHANT_APP_URL` | Replaced by `CORS_ALLOWED_ORIGINS` for CORS |
| `CUSTOMER_APP_URL` | Replaced by `CORS_ALLOWED_ORIGINS` for CORS |
| `API_URL` | Used by smoke script / tooling, not the API process |

---

## Database (migrations & seed)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Same as API; used by `packages/database` migrate/seed scripts |

Commands load `../../.env` from the database package when run via `pnpm db:migrate` / `pnpm db:seed`.

---

## Merchant app (`apps/merchant/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:3003` | Browser → API base URL (build-time for production images) |

No server secrets in the merchant app. Staff sessions use the API-issued Bearer token in `localStorage`.

---

## Customer app (`apps/customer/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:3003` | Browser → API base URL (build-time for production images) |

Guest ordering only; no customer auth env vars in this phase.

---

## Auth (merchant staff)

Configured on the **API** only:

| Variable | Purpose |
|----------|---------|
| `AUTH_SESSION_SECRET` | Signs session tokens returned from `POST /auth/merchant/login` |
| `AUTH_SESSION_TTL_MS` | Token expiry |

Readiness (`GET /ready`) verifies both auth and QR secrets are set and long enough.

---

## QR pickup tokens

| Variable | Purpose |
|----------|---------|
| `QR_SIGNING_SECRET` | Signs customer pickup QR / token strings |

---

## Rate limiting

| Variable | Purpose |
|----------|---------|
| `RATE_LIMIT_WINDOW_MS` | Fixed window length |
| `RATE_LIMIT_MAX_READS` | Permissive bucket (GET, etc.) |
| `RATE_LIMIT_MAX_MUTATIONS` | Stricter bucket (POST, PATCH, …) |

Limits are **per API process** (in-memory). Not shared across replicas until Redis is added in a later phase.

---

## CORS / origins

| Variable | Example | Purpose |
|----------|---------|---------|
| `CORS_ALLOWED_ORIGINS` | `https://merchant.staging.example.com,https://shop.staging.example.com` | Allowed `Origin` headers for browser `fetch` |

Must include every deployed Next.js origin that calls the API from the browser. No wildcard in MVP.

---

## Smoke script (`scripts/smoke-staging.sh`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_URL` | `http://localhost:3003` | API base URL |
| `SMOKE_MERCHANT_EMAIL` | `owner@demo-cafe.test` | Demo staff login |
| `SMOKE_MERCHANT_PASSWORD` | `ChangeMe123!` | Demo staff password (local seed only) |

---

## Staging template

See [`.env.staging.example`](../.env.staging.example) for a copy-paste staging file without real secrets.
