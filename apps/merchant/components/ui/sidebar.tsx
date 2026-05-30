"use client";

import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth-context";
import { useMerchant } from "../merchant-context";
import { formatRoleLabel } from "../../lib/permissions";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

const NAV_ITEMS = [
  { href: "/", label: "POS", icon: LayoutDashboard, requiresAudit: false },
  { href: "/products", label: "Products", icon: Package, requiresAudit: false },
  { href: "/orders", label: "Orders", icon: ClipboardList, requiresAudit: false },
  { href: "/pickup", label: "Pickup", icon: QrCode, requiresAudit: false },
  {
    href: "/audit-logs",
    label: "Audit logs",
    icon: ScrollText,
    requiresAudit: true,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { merchant } = useMerchant();
  const { canViewAuditLogs, role } = useMerchantPermissions();

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.requiresAudit || canViewAuditLogs,
  );

  return (
    <aside className="pos-sidebar" aria-label="Merchant navigation">
      <div className="pos-sidebar__brand-block">
        <div className="pos-sidebar__brand">
          <span className="pos-sidebar__mark">aR</span>
          <span className="pos-sidebar__brand-name">airRand</span>
        </div>
        <p className="pos-sidebar__merchant">{merchant?.name ?? "Merchant"}</p>
      </div>

      {user ? (
        <div className="pos-sidebar__profile">
          <p className="pos-sidebar__profile-role">
            {role ? formatRoleLabel(role) : "Staff"}
          </p>
          <p className="pos-sidebar__profile-email">{user.email}</p>
        </div>
      ) : null}

      <nav className="pos-sidebar__nav">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`pos-sidebar__link ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              <span className="pos-sidebar__link-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pos-sidebar__footer">
        <button
          type="button"
          className="pos-sidebar__link pos-sidebar__logout"
          onClick={() => void logout()}
        >
          <LogOut size={20} strokeWidth={1.75} aria-hidden />
          <span className="pos-sidebar__link-label">Log out</span>
        </button>
        <p className="pos-sidebar__disclaimer">
          airRand is not a payment processor. Payment is handled directly with
          the merchant.
        </p>
      </div>
    </aside>
  );
}
