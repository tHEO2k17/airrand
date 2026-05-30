"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { buildStoreTrackingUrl } from "../lib/store-paths";

export function ShareTrackingLink({
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

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Track order ${reference}`,
          text: `Track order ${reference}`,
          url: trackingUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="secondary" onClick={() => void handleShare()}>
      <Share2 size={16} aria-hidden />
      {copied ? "Link copied" : "Share tracking link"}
    </Button>
  );
}
