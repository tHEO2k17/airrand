"use client";

import { AlertMessage } from "./ui/alert-message";
import { LoadingState } from "./ui/loading-state";
import { useMerchant } from "./merchant-context";

export function MerchantGate({ children }: { children: React.ReactNode }) {
  const { loading, error, merchantId } = useMerchant();

  if (loading) {
    return <LoadingState label="Loading merchant…" />;
  }

  if (error || !merchantId) {
    return (
      <AlertMessage
        variant="error"
        message={error ?? "Merchant is not available."}
      />
    );
  }

  return <>{children}</>;
}
