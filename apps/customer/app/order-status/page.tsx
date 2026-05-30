"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "../../components/ui/loading-state";
import { readLatestOrderConfirmation } from "../../lib/order-confirmation";
import { buildStoreTrackingPath } from "../../lib/store-paths";

export default function LegacyOrderStatusRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = readLatestOrderConfirmation();
    if (stored?.merchantSlug && stored.reference) {
      router.replace(buildStoreTrackingPath(stored.merchantSlug, stored.reference));
      return;
    }
    router.replace("/");
  }, [router]);

  return <LoadingState label="Opening order tracking…" />;
}
