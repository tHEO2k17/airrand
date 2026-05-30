"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-context";
import { useMerchant } from "./merchant-context";
import { formatMoney } from "../lib/format";
import { buildStoreCartPath } from "../lib/store-paths";
import { Button } from "./ui/button";

export function StickyCartBar() {
  const pathname = usePathname();
  const { merchantSlug } = useMerchant();
  const { itemCount, subtotalCents, hydrated } = useCart();
  const isCatalogPage = /^\/store\/[^/]+$/u.test(pathname);

  if (!isCatalogPage || !hydrated || itemCount === 0) {
    return null;
  }

  return (
    <div className="store-sticky-cart" role="region" aria-label="Cart summary">
      <div className="store-sticky-cart__inner">
        <div className="store-sticky-cart__meta">
          <strong>
            {itemCount} item{itemCount === 1 ? "" : "s"} in cart
          </strong>
          <span>Estimated order value {formatMoney(subtotalCents)}</span>
        </div>
        <Link href={buildStoreCartPath(merchantSlug)}>
          <Button>View cart</Button>
        </Link>
      </div>
    </div>
  );
}
