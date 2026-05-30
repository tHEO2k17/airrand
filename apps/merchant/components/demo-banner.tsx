"use client";

import { useAuth } from "./auth-context";

export function DemoBanner() {
  const { user, merchant } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="demo-banner" role="status">
      Authenticated demo merchant ({merchant?.name ?? "—"}) as {user.email}. Local
      credentials only — not for production.
    </div>
  );
}
