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
import { toCustomerErrorMessage } from "../lib/customer-error-message";
import { CatalogProductCard } from "./catalog-product-card";
import { MerchantChip } from "./merchant-chip";
import { TrackOrderLookupForm } from "./track-order-lookup-form";
import { AlertMessage } from "./ui/alert-message";
import { Button } from "./ui/button";
import { CatalogLoadingSkeleton } from "./ui/catalog-loading-skeleton";
import { EmptyState } from "./ui/empty-state";
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
        setError(
          toCustomerErrorMessage(err, "Could not load products. Please try again."),
        );
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
    () => filteredProducts.slice(0, 8),
    [filteredProducts],
  );

  const highlightProducts = useMemo(() => {
    return products
      .filter((item) => item.product.isAvailable && item.product.stockState !== "out_of_stock")
      .slice(0, 4);
  }, [products]);

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

      <TrackOrderLookupForm />

      {error ? <AlertMessage variant="error" message={error} /> : null}
      {loading ? <CatalogLoadingSkeleton count={6} /> : null}

      {tab === "products" && !loading ? (
        <>
          {categoryFilter === "all" && highlightProducts.length > 0 ? (
            <section className="store-home-section" aria-labelledby="highlights-heading">
              <div className="store-home-section__head">
                <h2 id="highlights-heading" className="store-section-title">
                  Fresh in stock
                </h2>
                <p className="store-total-hint">Available now for pickup</p>
              </div>
              <div className="store-product-grid store-product-grid--commerce">
                {highlightProducts.map((item) => (
                  <CatalogProductCard
                    key={`highlight-${item.merchantSlug}-${item.product.id}`}
                    item={item}
                  />
                ))}
              </div>
            </section>
          ) : null}

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

          {categoryFilter === "all" ? (
            <section
              className="store-home-section store-home-section--secondary"
              aria-labelledby="nearby-heading"
            >
              <h2 id="nearby-heading" className="store-section-title">
                Popular near you
              </h2>
              <div className="store-placeholder-banner">
                <p className="store-placeholder-banner__title">Location coming soon</p>
                <p className="store-placeholder-banner__desc">
                  We&apos;ll surface nearby shops and fast-moving items here. For now,
                  browse all products above or open a shop below.
                </p>
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
              <div className="store-merchant-chips">
                {merchants.slice(0, 6).map((merchant) => (
                  <MerchantChip key={merchant.id} name={merchant.name} slug={merchant.slug} />
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
    </div>
  );
}
