"use client";

import { Alert } from "./alert";
import { LoadingState } from "./loading-state";
import { useMerchant } from "./merchant-context";

export function MerchantGate({ children }: { children: React.ReactNode }) {
  const { loading, error, merchantId } = useMerchant();

  if (loading) {
    return <LoadingState label="Loading demo merchant…" />;
  }

  if (error || !merchantId) {
    return (
      <Alert
        variant="error"
        message={error ?? "Merchant is not available."}
      />
    );
  }

  return <>{children}</>;
}
