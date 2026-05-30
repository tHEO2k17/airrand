"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import { useMerchant } from "./merchant-context";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/pickup", label: "Pickup" },
  { href: "/audit-logs", label: "Audit log" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { merchant, loading } = useMerchant();
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div>
          <p className="brand">airRand Merchant</p>
          <p className="merchant-name">
            {loading ? "Loading merchant…" : (merchant?.name ?? "—")}
          </p>
          {user ? (
            <p className="muted small-text">
              Signed in as {user.email} ({user.role})
            </p>
          ) : null}
        </div>
        <div className="site-header-actions">
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void logout()}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
