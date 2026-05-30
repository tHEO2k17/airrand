"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-context";
import { formatMoney } from "../lib/format";
import { Button } from "./ui/button";

export function StickyCartBar() {
  const pathname = usePathname();
  const { itemCount, subtotalCents, hydrated } = useCart();

  if (pathname !== "/" || !hydrated || itemCount === 0) {
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
        <Link href="/cart">
          <Button>View cart</Button>
        </Link>
      </div>
    </div>
  );
}
