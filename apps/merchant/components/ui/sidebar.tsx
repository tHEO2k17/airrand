"use client";

import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth-context";
import { useMerchant } from "../merchant-context";
import { formatRoleLabel } from "../../lib/permissions";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

const NAV_ITEMS = [
  { href: "/", label: "POS", icon: LayoutDashboard, requiresStaffView: false },
  { href: "/products", label: "Products", icon: Package, requiresStaffView: false },
  { href: "/orders", label: "Orders", icon: ClipboardList, requiresStaffView: false },
  { href: "/pickup", label: "Pickup", icon: QrCode, requiresStaffView: false },
  {
    href: "/staff",
    label: "Staff",
    icon: Users,
    requiresStaffView: true,
  },
  {
    href: "/audit-logs",
    label: "Audit logs",
    icon: ScrollText,
    requiresStaffView: false,
    requiresAudit: true,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { merchant } = useMerchant();
  const { canViewAuditLogs, canViewStaff, role } = useMerchantPermissions();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if ("requiresStaffView" in item && item.requiresStaffView && !canViewStaff) {
      return false;
    }
    if ("requiresAudit" in item && item.requiresAudit && !canViewAuditLogs) {
      return false;
    }
    return true;
  });

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
