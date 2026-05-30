"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "../../components/ui/loading-state";
import { readLatestOrderConfirmation } from "../../lib/order-confirmation";
import { buildStoreCartPath } from "../../lib/store-paths";

export default function LegacyCartRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = readLatestOrderConfirmation();
    if (stored?.merchantSlug) {
      router.replace(buildStoreCartPath(stored.merchantSlug));
      return;
    }
    router.replace("/");
  }, [router]);

  return <LoadingState label="Opening cart…" />;
}
