"use client";

import { useAuth } from "../auth-context";
import { useMerchant } from "../merchant-context";

export function PosHeader() {
  const { user } = useAuth();
  const { merchant } = useMerchant();

  return (
    <header className="pos-header">
      <div>
        <h1 className="pos-header__title">Order Line</h1>
        <p className="pos-header__subtitle">
          {merchant?.name ?? "Merchant"} · signed in as {user?.email ?? "—"}
        </p>
      </div>
      <p className="pos-header__note">
        Payments are handled outside airRand. Use this console for catalog,
        fulfillment, and pickup verification only.
      </p>
    </header>
  );
}
