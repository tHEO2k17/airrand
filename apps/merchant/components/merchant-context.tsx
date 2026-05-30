"use client";

import type { MerchantResponse } from "@airrand/contracts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMerchants } from "../lib/api";
import { DEMO_MERCHANT_SLUG } from "../lib/config";

interface MerchantContextValue {
  merchant: MerchantResponse | null;
  merchantId: string | null;
  loading: boolean;
  error: string | null;
  refreshMerchant: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextValue | null>(null);

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMerchant = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const merchants = await fetchMerchants();
      const demo = merchants.find((m) => m.slug === DEMO_MERCHANT_SLUG);
      if (!demo) {
        throw new Error(
          `Demo merchant "${DEMO_MERCHANT_SLUG}" not found. Run pnpm db:seed.`,
        );
      }
      setMerchant(demo);
    } catch (err) {
      setMerchant(null);
      setError(err instanceof Error ? err.message : "Failed to load merchant");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMerchant();
  }, [refreshMerchant]);

  const value = useMemo(
    () => ({
      merchant,
      merchantId: merchant?.id ?? null,
      loading,
      error,
      refreshMerchant,
    }),
    [merchant, loading, error, refreshMerchant],
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
