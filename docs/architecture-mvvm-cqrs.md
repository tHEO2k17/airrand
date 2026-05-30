# MVVM + CQRS architecture guardrails

This document defines layer rules for the incremental refactor described in the architecture audit. It does not replace [architecture.md](./architecture.md); it adds **enforcement boundaries** for `apps/customer`, `apps/merchant`, and `apps/api`.

## Product boundary (non-negotiable)

airRand is **wallet-less pickup commerce orchestration**. This refactor must not introduce:

- payments, wallets, balances, ledgers
- payment intents, settlements, checkout providers
- financial custody or money movement

The platform coordinates merchants, products, orders, status, and QR pickup only. See [adr/0001-walletless-mvp.md](./adr/0001-walletless-mvp.md).

---

## Engineering expectations

| Principle | Application |
|-----------|-------------|
| **DRY** | One Drizzle read per use case in repositories; one mapper path via `lib/mappers.ts`; no duplicate catalog/order rules outside `@airrand/domain`. |
| **KISS** | Plain handler functions imported by routes — no command bus, no DI framework, no new packages for layering. |
| **YAGNI** | Extract queries/commands only when a route handler grows or needs tests; no speculative abstractions. |
| **SOLID** | Single responsibility per handler/repository; routes depend on handler interfaces (result unions), not Drizzle; shared packages stay stable. |

---

## Refactor strategy

1. **Backend first (Phase 1)** — extract read queries, then write commands, one slice at a time from `routes/merchants.ts`.
2. **Guardrails before mass moves (Phase 0)** — document layers; ESLint warns on schema imports in routes.
3. **Behavior parity** — same HTTP paths, status codes, JSON shapes, middleware, and side-effect order.
4. **Frontend later (Phases 2–4)** — MVVM feature slices after API boundaries are stable.
5. **Incremental barrels (Phase 5)** — `index.ts` per query/command feature; delete emptied `lib/` shims last.

Each slice: repository (Drizzle) → handler (orchestration + mappers) → thin route → unit tests with mocked repos.

---

## Rollback strategy

| Risk | Rollback |
|------|----------|
| Handler regression | Route re-inlines previous logic; handler kept but unused until fixed. |
| ESLint guardrails too noisy | Lower severity or narrow `files` glob in `apps/api/eslint.config.mjs`. |
| Repository split wrong | Handler calls previous `lib/` helper; repository becomes pass-through. |
| Frontend MVVM (later) | Feature barrel re-exports old `lib/` paths until parity proven. |

Prefer **revert the route wiring** over deleting new modules — extracted code remains the source of truth for the next attempt.

---

## Backend (`apps/api`) — CQRS layers

```
Routes          → HTTP mapping, middleware, parse input, call handler, jsonOk/jsonError (≤30 LOC per handler)
Queries         → Read use cases (no side effects)
Commands        → Write use cases (transactions + side effects)
Repositories    → Drizzle access only (no HTTP, no response formatting, no side effects)
lib/mappers     → Entity → contract DTO mapping (unchanged)
lib/            → Infra only after refactor (db, errors, response, queues, realtime)
```

### Allowed imports

| Layer | May import |
|-------|------------|
| `routes/` | query/command `index.ts`, middleware, `@airrand/contracts`, `lib/response`, `lib/errors` |
| `queries/`, `commands/` | repositories, `lib/mappers`, `@airrand/contracts`, `@airrand/domain` |
| `repositories/` | `@airrand/database`, `lib/db`, `drizzle-orm` |
| `lib/mappers` | `@airrand/contracts`, `@airrand/database` (types) |

### Forbidden imports

| Layer | Must not import |
|-------|-----------------|
| `routes/` | Drizzle schema tables, `lib/db`, direct repository modules |
| `queries/`, `commands/` | Hono, HTTP response helpers, `lib/db` |
| `repositories/` | Hono, mappers, `@airrand/contracts` response types |
| `lib/mappers` | repositories, handlers |

Routes call **handlers only**; handlers call **repositories**; repositories own **Drizzle/database access**.

### Handler convention

```ts
// queries/get-merchant-by-slug/get-merchant-by-slug.handler.ts
export async function getMerchantBySlugHandler(
  query: GetMerchantBySlugQuery,
  deps: GetMerchantBySlugDeps = defaultDeps,
): Promise<GetMerchantBySlugResult> { … }
```

Handlers return **result unions** (`ok` / `not_found` / `validation_error`); routes map to HTTP only.

**Side-effect order (writes):** persist → audit → publish realtime → enqueue job.

### Folder layout

```
apps/api/src/
├── routes/           # thin wiring
├── queries/<name>/   # query.ts, handler.ts, handler.test.ts, index.ts
├── commands/<name>/  # (Phase 1b+)
├── repositories/     # Drizzle reads/writes per aggregate
└── lib/              # infra + mappers
```

### ESLint (Phase 0)

`apps/api/eslint.config.mjs` warns when `src/routes/**/*.ts` imports Drizzle **schema table** symbols from `@airrand/database`. Legacy routes that still inline writes will warn until Phase 1b+ extraction. Severity can move to `error` once all routes delegate to handlers.

---

## Frontend (`apps/customer`, `apps/merchant`) — MVVM layers

```
View        → JSX, layout, events delegated upward. No fetch. No business rules.
ViewModel   → Hooks: state, commands, derived data, loading/error. Calls repositories only.
Model       → Pure functions, types, mappers. No React. No fetch.
Data        → API client, SSE, storage. No UI.
UI (shared) → Presentational components; props only.
```

### Allowed imports

```
View       → ViewModel hooks, UI primitives, Model types (read-only)
ViewModel  → Model, Data repositories
Model      → @airrand/contracts, @airrand/domain (pure)
Data       → @airrand/contracts, fetch, storage APIs
UI         → nothing from ViewModel/Data
```

### Forbidden imports

- View/Page → `lib/api.ts` or `fetch` directly
- Model → React
- Data → components
- `lib/` → `components/` (e.g. merchant permissions → auth ViewModel)

### Feature layout (target)

```
features/<name>/
├── view/
├── viewmodel/
├── model/
├── data/
└── index.ts          # public barrel (Phase 5)
```

---

## Phased rollout

| Phase | Scope |
|-------|--------|
| **0** | This doc + ESLint guardrails in `apps/api` |
| **1a** | Read-only queries: list merchants, get by slug, public products by slug |
| **1b+** | Commands + remaining queries; shrink `merchants.ts` to wiring only |
| **2** | Merchant auth MVVM centralization |
| **3** | Merchant POS MVVM |
| **4** | Customer MVVM |
| **5** | Feature barrels, delete emptied `lib/` files |

---

## References

- [architecture.md](./architecture.md) — system design and product boundaries
- [security-boundaries.md](./security-boundaries.md) — auth and data exposure rules
- [adr/0001-walletless-mvp.md](./adr/0001-walletless-mvp.md) — no payments/wallets in MVP
