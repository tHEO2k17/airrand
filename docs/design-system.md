# airRand design system

Unified **Theo / airRand** visual language for the merchant POS (`apps/merchant`) and customer storefront (`apps/customer`). Tokens are canonical in `@airrand/brand`; each app aliases them to `--pos-*` or `--store-*`.

## Brand direction

- **Positioning:** product-first commerce with operational excellence — customers discover items; merchants run pickup reliably.
- **Primary accent:** warm premium orange (`--airrand-accent` / `#f97316`) for CTAs, chips, and brand moments.
- **Surfaces:** light canvas (`--airrand-bg-page` / `#f8fafc`), white cards, **dark sidebar** (`--airrand-sidebar` / `#0f172a`) for merchant ops.
- **Constraints:** no gradients, neon, or glassmorphism; subtle shadows only; strong contrast for tablet counters and outdoor glare.
- **Feel:** modern African retail-tech — readable, calm, confident; not marketplace-noisy.

## Token locations

| Layer | Path |
|-------|------|
| Canonical | `packages/brand/tokens/airrand-tokens.css` (`--airrand-*`) |
| Merchant aliases | `apps/merchant/design-system/tokens.css` (`--pos-*`) |
| Customer aliases | `apps/customer/design-system/tokens.css` (`--store-*`) |
| Merchant components | `apps/merchant/design-system/pos.css`, `primitives.css` |
| Customer components | `apps/customer/design-system/storefront.css`, `primitives.css` |

Both apps share spacing scale, radius scale, typography (Inter), elevation tokens, and semantic colors mapped from the same `--airrand-*` source.

## Semantic colors

| State | Token | Usage |
|-------|-------|--------|
| Success | `--airrand-success` (`#16a34a`) / `-soft` | Completed actions, ready pickup |
| Error | `--airrand-danger` (`#dc2626`) / `-soft` | Failures, validation |
| Info | `--airrand-info` (`#334155`) / `-soft` | Queued jobs, neutral ops notes |
| Warning | `--airrand-warning` (`#fb923c`) + orange soft surfaces | Low stock, caution — no yellow primary warnings |

CSS: `.pos-alert--*` (merchant), `.store-alert--*` (customer). Operational attention sounds/notifications use the same palette — no separate alert brand.

## Product icons (`@airrand/product-icons`)

Deterministic Lucide mapping — **no image uploads** in this phase.

**Resolution order:**

1. **Product name + category name keywords** (e.g. espresso → cup, pain relief → pill, groceries → basket)
2. **Category `iconKey`** from merchant catalog (e.g. `cup`, `shirt`, `heart-pulse` → pill)
3. **Category name** (e.g. “Laundry” → shirt, “Electronics” → smartphone)
4. **Fallback** → `generic` (shopping bag)

Shared API:

- `resolveProductIconKey({ productName, categoryName?, categoryIconKey? })` — pure, tested
- `getProductIconComponent(input)` — React / Lucide

Used on customer product cards, home browse, and merchant menu grid.

## Customer UX philosophy

- **Product-first landing:** default **Browse** tab shows categorized products across shops; **Shops** tab is secondary.
- **Sections:** Fresh in stock highlights → category chips → popular picks → “Popular near you” placeholder → merchant chips.
- **Merchant visibility:** shop name is subtle on cards; merchant chips link to storefronts.
- **No** recommendations, personalization, maps, or rankings.

## UI primitives

| Component | Merchant | Customer |
|-----------|----------|----------|
| Alerts | `AlertMessage`, `NotificationFeedback` | `AlertMessage` |
| Badges / chips | `.pos-badge`, `.pos-category-chip` | `.store-badge`, `.store-category-chip`, `.store-merchant-chip` |
| Buttons | `.pos-btn` | `.store-btn` |
| Surfaces | `.pos-surface`, `.pos-card` | `.store-surface`, `.store-card` |
| Loading | `LoadingState` | `CatalogLoadingSkeleton` |

Use semantic variants — avoid one-off hex values in feature code.

## Accessibility & touch (pilot)

- **Minimum touch target:** `--airrand-touch-min` (44px) on primary controls, category chips, cart quantity buttons, tracking actions, and merchant fulfillment buttons (`.pos-btn--fulfillment`).
- **Focus:** global `:focus-visible` outline using brand accent in each app’s `globals.css`.
- **Screen readers:** merchant POS announces new queue activity via an `aria-live="polite"` region when unread orders are present.
- **Pickup QR:** customer tracking shows a locked placeholder at `accepted`; scannable QR only at `ready`.

## Surfaces to preserve

- **Merchant:** dark sidebar, Order Line, status badges, pickup verification modal — refine tokens only; do not redesign layout.
- **Customer:** mobile-first grid, sticky cart, orange primary CTA — product cards are the hero.

## Related docs

- [Architecture — product-first catalog](./architecture.md#product-first-customer-experience)
- [Market scope](./market-scope.md)
- [Operational notifications](./architecture.md#operational-notifications-phase-10d)
