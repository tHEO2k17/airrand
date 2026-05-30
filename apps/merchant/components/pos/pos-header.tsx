"use client";

import { useAuth } from "../auth-context";
import { useMerchant } from "../merchant-context";
import { formatRoleLabel } from "../../lib/permissions";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

export function PosHeader() {
  const { user } = useAuth();
  const { merchant } = useMerchant();
  const { role } = useMerchantPermissions();

  return (
    <header className="pos-header">
      <div>
        <h1 className="pos-header__title">Order Line</h1>
        <p className="pos-header__subtitle">
          {merchant?.name ?? "Merchant"} · signed in as {user?.email ?? "—"}
          {role ? (
            <span className="pos-role-badge">{formatRoleLabel(role)}</span>
          ) : null}
        </p>
      </div>
      <p className="pos-header__note">
        Payments are handled outside airRand. Use this console for catalog,
        fulfillment, and pickup verification only.
      </p>
    </header>
  );
}
