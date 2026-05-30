# airRand design system

Unified **Theo / airRand** visual language for the merchant POS (`apps/merchant`) and customer storefront (`apps/customer`). Tokens are canonical in `@airrand/brand`; each app aliases them to `--pos-*` or `--store-*`.

## Brand direction

- **Positioning:** product-first commerce with operational excellence — customers discover items; merchants run pickup reliably.
- **Primary accent:** warm premium orange (`--airrand-accent` / `#ea6c1f`) for CTAs, chips, and brand moments.
- **Surfaces:** soft neutral page canvas (`--airrand-bg-page`), white cards, **charcoal** merchant sidebar (`--airrand-charcoal`).
- **Constraints:** no gradients, neon, or glassmorphism; subtle shadows only; strong contrast for tablet counters and outdoor glare.
- **Feel:** modern African retail-tech — readable, calm, confident; not marketplace-noisy.

## Token locations

| Layer | Path |
|-------|------|
| Canonical | `packages/brand/tokens/airrand-tokens.css` (`--airrand-*`) |
| Merchant aliases | `apps/merchant/design-system/tokens.css` (`--pos-*`) |
| Customer aliases | `apps/customer/design-system/tokens.css` (`--store-*`) |
| Merchant components | `apps/merchant/design-system/pos.css` |
| Customer components | `apps/customer/design-system/storefront.css` |

Both apps share spacing scale, radius scale, typography (Inter), and semantic colors mapped from the same `--airrand-*` source.

## Semantic colors

| State | Token | Usage |
|-------|-------|--------|
| Success | `--airrand-success` / `-soft` | Completed actions, ready pickup |
| Error | `--airrand-danger` / `-soft` | Failures, validation |
| Info | `--airrand-info` / `-soft` | Queued jobs, neutral ops notes |
| Warning | `--airrand-warning-soft` + accent text | Low stock, caution (orange family) |

CSS: `.pos-alert--*` (merchant), `.store-alert--*` (customer). Operational attention sounds/notifications use the same palette — no separate alert brand.

## Product icons (`@airrand/product-icons`)

Deterministic Lucide mapping — **no image uploads** in this phase.

**Resolution order:**

1. **Product name + category name keywords** (e.g. espresso → cup, pain relief → pill)
2. **Category `iconKey`** from merchant catalog (e.g. `cup`, `shirt`, `heart-pulse` → pill)
3. **Category name** (e.g. “Laundry” → shirt)
4. **Fallback** → `generic` (shopping bag)

Shared API:

- `resolveProductIconKey({ productName, categoryName?, categoryIconKey? })` — pure, tested
- `getProductIconComponent(input)` — React / Lucide

Used on customer product cards, home browse, and merchant menu grid.

## Customer UX philosophy

- **Product-first landing:** default **Browse** tab shows categorized products across shops; **Shops** tab is secondary.
- **Merchant visibility:** shop name is subtle on cards; storefront link for cart/checkout.
- **No** recommendations, personalization, maps, or rankings.

## UI primitives

| Component | Merchant | Customer |
|-----------|----------|----------|
| Alerts | `AlertMessage`, `NotificationFeedback` | `AlertMessage` |
| Badges / chips | `.pos-badge`, `.pos-category-chip` | `.store-badge`, `.store-category-chip` |
| Buttons | `.pos-btn` | `.store-btn` |
| Surfaces | `.pos-surface` | `.store-surface` |

Use semantic variants — avoid one-off hex values in feature code.

## Surfaces to preserve

- **Merchant:** dark sidebar, Order Line, status badges — refine tokens only; do not redesign layout.
- **Customer:** mobile-first grid, sticky cart, orange primary CTA — improve hierarchy and product cards.

## Related docs

- [Architecture — product-first catalog](./architecture.md#product-first-customer-experience)
- [Market scope](./market-scope.md)
- [Operational notifications](./architecture.md#operational-notifications-phase-10d)
