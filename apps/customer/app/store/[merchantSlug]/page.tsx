"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductResponse } from "@airrand/contracts";
import { EmptyState } from "../../../components/ui/empty-state";
import { AlertMessage } from "../../../components/ui/alert-message";
import { Button } from "../../../components/ui/button";
import { LoadingState } from "../../../components/ui/loading-state";
import { Surface } from "../../../components/ui/surface";
import { Badge } from "../../../components/ui/badge";
import { useCart } from "../../../components/cart-context";
import { useMerchant } from "../../../components/merchant-context";
import { fetchAvailableProductsBySlug } from "../../../lib/api";
import { formatMoney } from "../../../lib/format";
import { getProductIcon } from "../../../lib/product-icon";

export default function StoreCatalogPage() {
  const { merchant, merchantSlug, loading: merchantLoading, error: merchantError } =
    useMerchant();
  const { addProduct } = useCart();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const load = useCallback(async () => {
    if (merchantError) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchAvailableProductsBySlug(merchantSlug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [merchantSlug, merchantError]);

  useEffect(() => {
    if (!merchantLoading) {
      void load();
    }
  }, [load, merchantLoading]);

  const categoryChips = useMemo(() => {
    const byId = new Map<string, string>();
    for (const product of products) {
      if (product.category) {
        byId.set(product.category.id, product.category.name);
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === "all") {
      return products;
    }
    return products.filter((p) => p.categoryId === categoryFilter);
  }, [products, categoryFilter]);

  function handleAdd(product: ProductResponse) {
    addProduct({
      id: product.id,
      name: product.name,
      unitPriceCents: product.unitPriceCents,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  if (merchantLoading) {
    return <LoadingState label="Loading store…" />;
  }

  if (merchantError) {
    return (
      <div className="store-page store-page--centered">
        <AlertMessage variant="error" message={merchantError} />
      </div>
    );
  }

  return (
    <div className="store-page">
      <header className="store-hero">
        <h1>{merchant?.name ?? "Store"}</h1>
        <p>Order ahead and pick up faster.</p>
      </header>

      {error ? <AlertMessage variant="error" message={error} /> : null}
      {loading ? <LoadingState label="Loading menu…" /> : null}

      {!loading && !error && products.length > 0 && categoryChips.length > 0 ? (
        <div className="store-category-chips" role="tablist" aria-label="Categories">
          <button
            type="button"
            className={`store-category-chip${categoryFilter === "all" ? " store-category-chip--active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            All
          </button>
          {categoryChips.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`store-category-chip${categoryFilter === category.id ? " store-category-chip--active" : ""}`}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}

      {!loading && !error && products.length === 0 ? (
        <Surface>
          <EmptyState
            title="Nothing on the menu yet"
            description="Check back soon — this store has no available items right now."
          />
        </Surface>
      ) : null}

      {!loading && filteredProducts.length > 0 ? (
        <div className="store-product-grid">
          {filteredProducts.map((product) => {
            const Icon = getProductIcon(product.name);
            const outOfStock = product.stockState === "out_of_stock";
            return (
              <Surface
                key={product.id}
                className={`store-product-card${outOfStock ? " store-product-card--disabled" : ""}`}
                padding="lg"
              >
                <div className="store-product-card__top">
                  <div className="store-product-card__icon" aria-hidden>
                    <Icon size={24} strokeWidth={1.75} />
                  </div>
                  <div className="store-product-card__body">
                    <div className="store-product-card__meta">
                      {product.category ? (
                        <span className="store-product-card__category">
                          {product.category.name}
                        </span>
                      ) : null}
                      {product.stockState === "low_stock" ? (
                        <Badge tone="accent">Low stock</Badge>
                      ) : null}
                    </div>
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
                  disabled={outOfStock || !product.isAvailable}
                  onClick={() => handleAdd(product)}
                >
                  {outOfStock
                    ? "Out of stock"
                    : addedId === product.id
                      ? "Added to cart"
                      : "Add to cart"}
                </Button>
              </Surface>
            );
          })}
        </div>
      ) : null}

      {!loading && products.length > 0 && filteredProducts.length === 0 ? (
        <p className="store-muted">No items in this category right now.</p>
      ) : null}
    </div>
  );
}
