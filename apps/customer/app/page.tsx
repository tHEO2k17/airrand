"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MerchantResponse } from "@airrand/contracts";
import { AlertMessage } from "../components/ui/alert-message";
import { Button } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty-state";
import { LoadingState } from "../components/ui/loading-state";
import { Surface } from "../components/ui/surface";
import { fetchMerchants } from "../lib/api";
import { buildStorePath } from "../lib/store-paths";

export default function HomePage() {
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        setMerchants(await fetchMerchants());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stores");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="store-page store-page--centered">
      <header className="store-hero">
        <p className="store-header__brand">airRand</p>
        <h1>Order ahead for pickup</h1>
        <p>Choose a store to browse the menu and reserve for pickup.</p>
      </header>

      {error ? <AlertMessage variant="error" message={error} /> : null}
      {loading ? <LoadingState label="Loading stores…" /> : null}

      {!loading && !error && merchants.length === 0 ? (
        <Surface>
          <EmptyState
            title="No stores available"
            description="Check back soon — no merchants are listed yet."
          />
        </Surface>
      ) : null}

      {!loading && merchants.length > 0 ? (
        <div className="store-store-list">
          {merchants.map((merchant) => (
            <Surface key={merchant.id} padding="lg">
              <h2 className="store-section-title">{merchant.name}</h2>
              <p className="store-total-hint">/{merchant.slug}</p>
              <Link href={buildStorePath(merchant.slug)} style={{ display: "block", marginTop: "1rem" }}>
                <Button block>Open store</Button>
              </Link>
            </Surface>
          ))}
        </div>
      ) : null}
    </div>
  );
}
