"use client";

import { PickupVerificationPanel } from "../../components/pickup-verification-panel";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";

function PickupContent() {
  return (
    <PageShell
      title="Pickup verification"
      description="Dedicated pickup screen — you can also verify from the dashboard when an order is ready."
    >
      <PickupVerificationPanel variant="page" />
    </PageShell>
  );
}

export default function PickupPage() {
  return (
    <MerchantGate>
      <PickupContent />
    </MerchantGate>
  );
}
