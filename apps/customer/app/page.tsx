"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductResponse } from "@airrand/contracts";
import { Alert } from "../components/alert";
import { useCart } from "../components/cart-context";
import { LoadingState } from "../components/loading-state";
import { useMerchant } from "../components/merchant-context";
import { fetchAvailableProducts } from "../lib/api";
import { formatMoney } from "../lib/format";

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
      const list = await fetchAvailableProducts(merchantId);
      setProducts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
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
    <section className="page-shell">
      <header className="page-header">
        <h1>{merchant?.name ?? "Store"}</h1>
        <p className="page-description">
          Reserve items for pickup. No online payment on airRand.
        </p>
      </header>

      {merchantError ? <Alert variant="error" message={merchantError} /> : null}
      {error ? <Alert variant="error" message={error} /> : null}
      {merchantLoading || loading ? <LoadingState label="Loading menu…" /> : null}

      {!loading && !error && products.length === 0 ? (
        <div className="card">
          <p className="page-description">No available products right now.</p>
        </div>
      ) : null}

      {!loading && products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <article key={product.id} className="card product-card">
              <div>
                <h2>{product.name}</h2>
                {product.description ? (
                  <p className="product-description">{product.description}</p>
                ) : null}
                <p className="product-price">{formatMoney(product.unitPriceCents)}</p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => handleAdd(product)}
              >
                {addedId === product.id ? "Added" : "Add to cart"}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
