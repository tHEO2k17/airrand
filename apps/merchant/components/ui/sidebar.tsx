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
import { formatRoleLabel } from "../../lib/permissions";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

const NAV_ITEMS = [
  { href: "/", label: "POS", icon: LayoutDashboard, requiresAudit: false },
  { href: "/products", label: "Products", icon: Package, requiresAudit: false },
  { href: "/orders", label: "Orders", icon: ClipboardList, requiresAudit: false },
  { href: "/pickup", label: "Pickup", icon: QrCode, requiresAudit: false },
  {
    href: "/audit-logs",
    label: "Audit",
    icon: ScrollText,
    requiresAudit: true,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { canViewAuditLogs, role } = useMerchantPermissions();

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.requiresAudit || canViewAuditLogs,
  );

  return (
    <aside className="pos-sidebar" aria-label="Merchant navigation">
      <div className="pos-sidebar__brand" title="airRand Merchant">
        <span className="pos-sidebar__mark">aR</span>
        {role ? (
          <span className="pos-sidebar__role">{formatRoleLabel(role)}</span>
        ) : null}
      </div>

      <nav className="pos-sidebar__nav">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`pos-sidebar__link ${active ? "is-active" : ""}`}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="pos-sidebar__link pos-sidebar__logout"
        title="Log out"
        aria-label="Log out"
        onClick={() => void logout()}
      >
        <LogOut size={22} strokeWidth={1.75} />
      </button>
    </aside>
  );
}
