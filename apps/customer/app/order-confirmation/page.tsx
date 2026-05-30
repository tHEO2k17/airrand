"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "../../components/ui/loading-state";
import { readLatestOrderConfirmation } from "../../lib/order-confirmation";
import { buildStoreConfirmationPath } from "../../lib/store-paths";

export default function LegacyOrderConfirmationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = readLatestOrderConfirmation();
    if (stored?.merchantSlug) {
      router.replace(buildStoreConfirmationPath(stored.merchantSlug));
      return;
    }
    router.replace("/");
  }, [router]);

  return <LoadingState label="Opening confirmation…" />;
}
