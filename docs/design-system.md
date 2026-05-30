# airRand design system

Shared visual language for the **merchant POS** (`apps/merchant`) and **customer storefront** (`apps/customer`). This is documentation only — tokens live in each app’s `design-system/` folder.

## Brand direction

- **Primary accent:** orange `#f97316` (`--pos-accent` / `--store-accent`) for actions, highlights, and brand moments.
- **Operational palette:** neutral grays on light surfaces (`#eceef2` page bg, `#ffffff` cards) with a **dark sidebar** on merchant (`#111827`).
- **No new primary colors.** Extend the system with existing semantic tokens only.
- **No gradients, neon, or unrelated accent colors.**

## Token locations

| App | Tokens | Components |
|-----|--------|------------|
| Merchant | `apps/merchant/design-system/tokens.css` | `apps/merchant/design-system/pos.css` |
| Customer | `apps/customer/design-system/tokens.css` | `apps/customer/design-system/storefront.css` |

Both apps share the same accent orange, typography scale (Inter), spacing scale, and card radius language.

## Semantic colors

Use these for feedback states — including notification-related UI:

| State | Merchant token | Customer token | Usage |
|-------|----------------|----------------|--------|
| Success | `--pos-success` / `--pos-success-soft` | `--store-success` / `--store-success-soft` | Action completed (order updated, export ready) |
| Error | `--pos-danger` / `--pos-danger-soft` | `--store-danger` / `--store-danger-soft` | Failures, validation, permission denied |
| Info | `--pos-info` / `--pos-info-soft` | `--store-info` / `--store-info-soft` | Background jobs queued, neutral operational notes |
| Warning | `--pos-accent-hover` on `--pos-accent-soft` | `--store-accent-hover` on `--store-accent-soft` | Caution without error (uses orange family, not a new hue) |

CSS classes: `.pos-alert--*` (merchant), `.store-alert--*` (customer).

## UI primitives

| Component | Path | Notes |
|-----------|------|--------|
| `AlertMessage` | `components/ui/alert-message.tsx` | Base semantic banner; Lucide icon + text |
| `NotificationFeedback` | `apps/merchant/components/ui/notification-feedback.tsx` | Maps notification UI **kinds** → `AlertMessage` variants |

### NotificationFeedback kinds (merchant)

| Kind | Variant | When |
|------|---------|------|
| `actionSuccess` | success | Primary action succeeded |
| `notificationQueued` | info | Operational notification job enqueued (Phase 10D) |
| `warning` | warning | Non-blocking caution |
| `error` | error | Failure |
| `info` | info | General operational info |

**Do not** style notification states with custom one-off colors — always go through `AlertMessage` / `NotificationFeedback`.

## Notification copy (SMS / email placeholders)

Canonical template strings live in `@airrand/notifications/templates`:

- **UI copy** (`NOTIFICATION_UI_COPY`) — short in-app banners
- **Template copy** (`NOTIFICATION_TEMPLATE_COPY`, `renderNotificationTemplate`) — future SMS/email bodies

Copy rules:

- Operational clarity first — what happened and what to do next
- Short, actionable sentences; no marketing fluff
- Plain text; no HTML templates in MVP
- No payment, wallet, balance, or promotional language
- Merchant name + order reference where helpful (`ORD-1001`)

Example SMS (order ready):

> Demo Cafe: Order ORD-1001 is ready for pickup. Show your pickup code at the counter.

## Surfaces to preserve

- **Merchant:** dark sidebar, Order Line cards, status badges, operational `Surface` panels — do not redesign for notification features.
- **Customer:** mobile-first storefront, orange CTA, clean cart/checkout — notification UX stays server-side until OTP phase.

## Related docs

- [Architecture — operational notifications](./architecture.md#operational-notifications-phase-10d)
- [Customer data policy](./customer-data-policy.md)
