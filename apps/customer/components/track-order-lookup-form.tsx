"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveTrackOrderLookup } from "../lib/track-order-lookup";
import { AlertMessage } from "./ui/alert-message";
import { Button } from "./ui/button";
import { Surface } from "./ui/surface";

export function TrackOrderLookupForm() {
  const router = useRouter();
  const [merchantSlug, setMerchantSlug] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = resolveTrackOrderLookup(merchantSlug, reference);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(result.path);
  }

  return (
    <Surface padding="lg">
      <h2 className="store-section-title">Track existing order</h2>
      <p className="store-total-hint" style={{ marginBottom: "1rem" }}>
        Use the store slug from your link and the order reference from your
        receipt. No sign-in required.
      </p>

      {error ? <AlertMessage variant="error" message={error} /> : null}

      <form className="store-form" onSubmit={handleSubmit}>
        <label>
          Store slug
          <input
            value={merchantSlug}
            onChange={(event) => setMerchantSlug(event.target.value)}
            placeholder="kofi-mart"
            autoComplete="off"
            required
          />
        </label>

        <label>
          Order reference
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="ORD-1022 or 1022"
            autoComplete="off"
            required
          />
        </label>

        <Button type="submit" block>
          Open tracking
        </Button>
      </form>
    </Surface>
  );
}
