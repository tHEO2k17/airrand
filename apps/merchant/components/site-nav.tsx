"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMerchant } from "./merchant-context";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/pickup", label: "Pickup" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { merchant, loading } = useMerchant();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div>
          <p className="brand">airRand Merchant</p>
          <p className="merchant-name">
            {loading ? "Loading merchant…" : (merchant?.name ?? "—")}
          </p>
        </div>
        <nav className="site-nav" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "nav-link active" : "nav-link"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
