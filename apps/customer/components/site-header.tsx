"use client";

import Link from "next/link";
import { useCart } from "./cart-context";
import { useMerchant } from "./merchant-context";

export function SiteHeader() {
  const { merchant, loading } = useMerchant();
  const { itemCount, hydrated } = useCart();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div>
          <p className="brand">airRand</p>
          <p className="store-name">
            {loading ? "Loading store…" : (merchant?.name ?? "Store")}
          </p>
        </div>
        <Link href="/cart" className="cart-link">
          Cart ({hydrated ? itemCount : 0})
        </Link>
      </div>
    </header>
  );
}
