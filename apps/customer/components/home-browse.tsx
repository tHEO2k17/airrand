"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MerchantResponse } from "@airrand/contracts";
import {
  filterCatalogByCategory,
  groupCatalogByCategory,
  loadCatalogProducts,
  type CatalogProduct,
} from "../lib/catalog-discovery";
import {
  defaultHomeBrowseTab,
  HOME_BROWSE_TABS,
  type HomeBrowseTab,
} from "../lib/home-navigation";
import { buildStorePath } from "../lib/store-paths";
import { CatalogProductCard } from "./catalog-product-card";
import { TrackOrderLookupForm } from "./track-order-lookup-form";
import { AlertMessage } from "./ui/alert-message";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { LoadingState } from "./ui/loading-state";
import { Surface } from "./ui/surface";

export function HomeBrowse() {
  const [tab, setTab] = useState<HomeBrowseTab>(defaultHomeBrowseTab());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const catalog = await loadCatalogProducts();
        setProducts(catalog.products);
        setMerchants(catalog.merchants);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load catalog");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categoryChips = useMemo(() => {
    return groupCatalogByCategory(products).map((group) => ({
      id: group.id,
      name: group.name,
      count: group.products.length,
    }));
  }, [products]);

  const filteredProducts = useMemo(
    () => filterCatalogByCategory(products, categoryFilter),
    [products, categoryFilter],
  );

  const featuredProducts = useMemo(
    () => filteredProducts.slice(0, 12),
    [filteredProducts],
  );

  return (
    <div className="store-page store-home">
      <header className="store-hero store-hero--product-first">
        <p className="store-header__brand">airRand</p>
        <h1>Pick up what you need</h1>
        <p className="store-hero__lede">
          Browse products first — then checkout at the shop for pickup. No account
          required.
        </p>
      </header>

      <nav className="store-home-tabs" aria-label="Browse sections">
        {HOME_BROWSE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`store-home-tab${tab === item.id ? " store-home-tab--active" : ""}`}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error ? <AlertMessage variant="error" message={error} /> : null}
      {loading ? <LoadingState label="Loading catalog…" /> : null}

      {tab === "products" && !loading ? (
        <>
          {categoryChips.length > 0 ? (
            <div
              className="store-category-chips store-category-chips--home"
              role="tablist"
              aria-label="Product categories"
            >
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
                  <span className="store-category-chip__count">{category.count}</span>
                </button>
              ))}
            </div>
          ) : null}

          {products.length === 0 && !error ? (
            <Surface>
              <EmptyState
                title="No products available yet"
                description="Shops are getting ready. Check the Shops tab or try again soon."
              />
            </Surface>
          ) : null}

          {featuredProducts.length > 0 ? (
            <section className="store-home-section" aria-labelledby="featured-heading">
              <div className="store-home-section__head">
                <h2 id="featured-heading" className="store-section-title">
                  {categoryFilter === "all" ? "Popular picks" : "In this category"}
                </h2>
                <p className="store-total-hint">
                  {filteredProducts.length} item
                  {filteredProducts.length === 1 ? "" : "s"} available
                </p>
              </div>
              <div className="store-product-grid store-product-grid--commerce">
                {featuredProducts.map((item) => (
                  <CatalogProductCard key={`${item.merchantSlug}-${item.product.id}`} item={item} />
                ))}
              </div>
            </section>
          ) : null}

          {products.length > 0 && filteredProducts.length === 0 ? (
            <p className="store-muted">No products in this category right now.</p>
          ) : null}

          {merchants.length > 0 ? (
            <section className="store-home-section store-home-section--secondary">
              <h2 className="store-section-title">Nearby shops</h2>
              <p className="store-total-hint">
                Open a storefront to add items to your cart.
              </p>
              <div className="store-shop-strip">
                {merchants.slice(0, 4).map((merchant) => (
                  <Link
                    key={merchant.id}
                    href={buildStorePath(merchant.slug)}
                    className="store-shop-strip__link"
                  >
                    {merchant.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {tab === "shops" && !loading ? (
        <section className="store-home-section" aria-labelledby="shops-heading">
          <h2 id="shops-heading" className="store-section-title">
            All shops
          </h2>
          {merchants.length === 0 && !error ? (
            <Surface>
              <EmptyState
                title="No shops listed"
                description="Merchants will appear here when they go live."
              />
            </Surface>
          ) : null}
          <div className="store-store-list">
            {merchants.map((merchant) => (
              <Surface key={merchant.id} padding="lg" className="store-shop-card">
                <h3 className="store-shop-card__name">{merchant.name}</h3>
                {merchant.description ? (
                  <p className="store-shop-card__desc">{merchant.description}</p>
                ) : null}
                <p className="store-total-hint">/{merchant.slug}</p>
                <Link href={buildStorePath(merchant.slug)} style={{ display: "block", marginTop: "1rem" }}>
                  <Button block>Open storefront</Button>
                </Link>
              </Surface>
            ))}
          </div>
        </section>
      ) : null}

      <TrackOrderLookupForm />
    </div>
  );
}
