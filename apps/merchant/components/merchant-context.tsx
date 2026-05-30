"use client";

import type { MerchantResponse } from "@airrand/contracts";
import {
  createContext,
  useContext,
  useMemo,
} from "react";
import { useAuth } from "./auth-context";

interface MerchantContextValue {
  merchant: MerchantResponse | null;
  merchantId: string | null;
  loading: boolean;
  error: string | null;
  refreshMerchant: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextValue | null>(null);

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const { merchant, merchantId, loading, error, refreshSession } = useAuth();

  const merchantResponse = useMemo<MerchantResponse | null>(() => {
    if (!merchant) {
      return null;
    }

    return {
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
      description: merchant.description ?? null,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  }, [merchant]);

  const value = useMemo(
    () => ({
      merchant: merchantResponse,
      merchantId,
      loading,
      error,
      refreshMerchant: refreshSession,
    }),
    [merchantResponse, merchantId, loading, error, refreshSession],
  );

  return (
    <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>
  );
}

export function useMerchant() {
  const ctx = useContext(MerchantContext);
  if (!ctx) {
    throw new Error("useMerchant must be used within MerchantProvider");
  }
  return ctx;
}
