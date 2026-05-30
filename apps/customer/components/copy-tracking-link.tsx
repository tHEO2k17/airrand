"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "./ui/button";
import { buildStoreTrackingUrl } from "../lib/store-paths";

export function CopyTrackingLink({
  merchantSlug,
  reference,
}: {
  merchantSlug: string;
  reference: string;
}) {
  const [copied, setCopied] = useState(false);

  const trackingUrl =
    typeof window !== "undefined"
      ? buildStoreTrackingUrl(merchantSlug, reference, window.location.origin)
      : buildStoreTrackingUrl(merchantSlug, reference);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="secondary" onClick={() => void handleCopy()}>
      <Link2 size={16} aria-hidden />
      {copied ? "Link copied" : "Copy tracking link"}
    </Button>
  );
}
