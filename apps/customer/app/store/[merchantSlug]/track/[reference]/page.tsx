"use client";

import { use } from "react";
import { OrderTrackingView } from "../../../../../components/order-tracking-view";
import { parseStoreTrackingReference } from "../../../../../lib/store-paths";

export default function StoreOrderTrackingPage({
  params,
}: {
  params: Promise<{ merchantSlug: string; reference: string }>;
}) {
  const { merchantSlug, reference } = use(params);

  return (
    <OrderTrackingView
      merchantSlug={merchantSlug}
      reference={parseStoreTrackingReference(reference)}
    />
  );
}
