"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductResponse } from "@airrand/contracts";
import { EmptyState } from "../components/ui/empty-state";
import { AlertMessage } from "../components/ui/alert-message";
import { Button } from "../components/ui/button";
import { LoadingState } from "../components/ui/loading-state";
import { Surface } from "../components/ui/surface";
import { useCart } from "../components/cart-context";
import { useMerchant } from "../components/merchant-context";
import { fetchAvailableProducts } from "../lib/api";
import { formatMoney } from "../lib/format";
import { getProductIcon } from "../lib/product-icon";

export default function CatalogPage() {
  const { merchant, merchantId, loading: merchantLoading, error: merchantError } =
    useMerchant();
  const { addProduct } = useCart();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchAvailableProducts(merchantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleAdd(product: ProductResponse) {
    addProduct({
      id: product.id,
      name: product.name,
      unitPriceCents: product.unitPriceCents,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  return (
    <div className="store-page">
      <header className="store-hero">
        <h1>{merchant?.name ?? "Store"}</h1>
        <p>Order ahead and pick up faster.</p>
      </header>

      {merchantError ? <AlertMessage variant="error" message={merchantError} /> : null}
      {error ? <AlertMessage variant="error" message={error} /> : null}
      {merchantLoading || loading ? <LoadingState label="Loading menu…" /> : null}

      {!loading && !error && products.length === 0 ? (
        <Surface>
          <EmptyState
            title="Nothing on the menu yet"
            description="Check back soon — this store has no available items right now."
          />
        </Surface>
      ) : null}

      {!loading && products.length > 0 ? (
        <div className="store-product-grid">
          {products.map((product) => {
            const Icon = getProductIcon(product.name);
            return (
              <Surface key={product.id} className="store-product-card" padding="lg">
                <div className="store-product-card__top">
                  <div className="store-product-card__icon" aria-hidden>
                    <Icon size={24} strokeWidth={1.75} />
                  </div>
                  <div className="store-product-card__body">
                    <h2 className="store-product-card__name">{product.name}</h2>
                    {product.description ? (
                      <p className="store-product-card__desc">
                        {product.description}
                      </p>
                    ) : null}
                    <p className="store-product-card__price">
                      {formatMoney(product.unitPriceCents)}
                    </p>
                  </div>
                </div>
                <Button
                  block
                  variant={addedId === product.id ? "secondary" : "primary"}
                  onClick={() => handleAdd(product)}
                >
                  {addedId === product.id ? "Added to cart" : "Add to cart"}
                </Button>
              </Surface>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
