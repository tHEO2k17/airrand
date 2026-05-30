# Pilot operations guide

How merchants, customers, and staff use airRand storefront and tracking links during a live pilot.

## Merchant storefront links

Each merchant has a **storefront slug** (e.g. `demo-cafe`, `kofi-mart`). The customer-facing URL is:

```text
https://<customer-app-host>/store/<slug>
```

Examples:

- `http://localhost:3002/store/demo-cafe` (local)
- `https://shop.example.com/store/kofi-mart` (production)

### Sharing with customers

1. Sign in to the **merchant app** as owner or staff.
2. Use **Open storefront** in the sidebar (or copy the link from **Settings**).
3. Share the link on WhatsApp, SMS, posters, or QR codes at the counter.

Pilots should **not** share internal merchant UUIDs or staff login URLs as customer links.

## Customer ordering and tracking

### Browse and order

1. Open the storefront link.
2. Add items to the cart and complete guest checkout (phone number only).
3. After checkout, the customer sees a **confirmation** page with pickup QR (session) and a **Track order status** button.

### Track an order later

Customers only need:

- **Store slug** (from the storefront URL path), and
- **Order reference** (e.g. `ORD-1022` on receipt or confirmation).

Tracking URL format:

```text
/store/<slug>/track/<reference>
```

Example: `/store/kofi-mart/track/ORD-1022`

Reference input is forgiving: `1022`, `ord-1022`, and `ORD-1022` normalize to the same reference.

### Home page recovery

If the customer lost the confirmation page, they can use **Track existing order** on the customer app home page and enter slug + reference.

## Staff: recovering a lost QR or session

Customers may close the browser or clear session storage. Staff can help without exposing internal IDs:

1. Ask for the **order reference** (shown on POS and merchant orders list).
2. Confirm the **store name / slug** if the customer is unsure.
3. Send the tracking link:  
   `https://<customer-app>/store/<slug>/track/<reference>`
4. On the tracking page, when the order is **accepted** or **ready**, the pickup QR appears again (signed pickup token from the API).
5. Staff can also verify pickup from the merchant **Pickup** screen using the customer’s QR or token.

## What not to share

- Merchant or order UUIDs (internal only)
- Pickup token raw strings in chat (prefer the tracking page QR)
- Staff passwords or internal setup keys

See [order-references.md](./order-references.md), [customer-data-policy.md](./customer-data-policy.md), and [security-boundaries.md](./security-boundaries.md).
