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
import { ApiError, fetchMerchantBySlug } from "../lib/api";
import { normalizeStoreSlug } from "../lib/store-slug";

interface MerchantContextValue {
  merchant: MerchantResponse | null;
  merchantId: string | null;
  merchantSlug: string;
  loading: boolean;
  error: string | null;
}

const MerchantContext = createContext<MerchantContextValue | null>(null);

export function StoreMerchantProvider({
  merchantSlug,
  children,
}: {
  merchantSlug: string;
  children: React.ReactNode;
}) {
  const normalizedSlug = normalizeStoreSlug(merchantSlug);
  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMerchant(await fetchMerchantBySlug(normalizedSlug));
    } catch (err) {
      setMerchant(null);
      if (err instanceof ApiError && err.code === "MERCHANT_NOT_FOUND") {
        setError("This store could not be found. Check the link and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load store");
      }
    } finally {
      setLoading(false);
    }
  }, [normalizedSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({
      merchant,
      merchantId: merchant?.id ?? null,
      merchantSlug: normalizedSlug,
      loading,
      error,
    }),
    [merchant, normalizedSlug, loading, error],
  );

  return (
    <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>
  );
}

export function useMerchant() {
  const ctx = useContext(MerchantContext);
  if (!ctx) {
    throw new Error("useMerchant must be used within StoreMerchantProvider");
  }
  return ctx;
}
