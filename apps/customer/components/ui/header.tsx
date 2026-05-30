"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../cart-context";
import { useMerchant } from "../merchant-context";

export function Header() {
  const { merchant, loading } = useMerchant();
  const { itemCount, hydrated } = useCart();

  return (
    <header className="store-header">
      <div className="store-header__inner">
        <div>
          <p className="store-header__brand">airRand</p>
          <p className="store-header__store">
            {loading ? "Loading…" : (merchant?.name ?? "Store")}
          </p>
        </div>
        <Link href="/cart" className="store-cart-link">
          <ShoppingCart size={18} aria-hidden />
          <span>Cart ({hydrated ? itemCount : 0})</span>
        </Link>
      </div>
    </header>
  );
}
