"use client";

import { useMemo, useState } from "react";
import type { ProductCategoryResponse, ProductResponse } from "@airrand/contracts";
import { AvailabilityToggle } from "../ui/availability-toggle";
import { Surface } from "../ui/surface";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { formatMoney } from "../../lib/format";
import { getProductIcon } from "../../lib/product-icon";
import {
  isProductPosDisabled,
  STOCK_STATE_LABELS,
} from "../../lib/stock-state";
import { MenuToolbar } from "./menu-toolbar";

function stockBadgeTone(
  stockState: ProductResponse["stockState"],
): "success" | "accent" | "neutral" {
  if (stockState === "in_stock") {
    return "success";
  }
  if (stockState === "low_stock") {
    return "accent";
  }
  return "neutral";
}

export function ProductGrid({
  products,
  categories,
  saving,
  canManageProducts = true,
  onToggleAvailability,
  onStockStateChange,
}: {
  products: ProductResponse[];
  categories: ProductCategoryResponse[];
  saving: boolean;
  canManageProducts?: boolean;
  onToggleAvailability: (product: ProductResponse) => void;
  onStockStateChange: (
    product: ProductResponse,
    stockState: ProductResponse["stockState"],
  ) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.category?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, query, categoryFilter]);

  if (products.length === 0) {
    return (
      <Surface padding="lg">
        <EmptyState
          title="No menu items"
          description="Add products from the Products screen to build your catalog."
        />
      </Surface>
    );
  }

  return (
    <>
      <div className="pos-category-chips" role="tablist" aria-label="Filter by category">
        <button
          type="button"
          className={`pos-category-chip${categoryFilter === "all" ? " pos-category-chip--active" : ""}`}
          onClick={() => setCategoryFilter("all")}
        >
          All
        </button>
        {categories
          .filter((c) => c.isActive)
          .map((category) => (
            <button
              key={category.id}
              type="button"
              className={`pos-category-chip${categoryFilter === category.id ? " pos-category-chip--active" : ""}`}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.name}
            </button>
          ))}
      </div>
      <MenuToolbar
        query={query}
        onQueryChange={setQuery}
        resultCount={filtered.length}
      />
      {filtered.length === 0 ? (
        <p className="pos-muted">No items match your search.</p>
      ) : (
        <div className="pos-product-grid">
          {filtered.map((product) => {
            const Icon = getProductIcon(product);
            const disabled = isProductPosDisabled(product.stockState);
            return (
              <Surface
                key={product.id}
                padding="md"
                className={`pos-product-card${disabled ? " pos-product-card--disabled" : ""}`}
              >
                <div className="pos-product-card__icon" aria-hidden>
                  <Icon size={26} strokeWidth={1.75} />
                </div>
                <div className="pos-product-card__body">
                  <div className="pos-product-card__head">
                    <h3 className="pos-product-card__name">{product.name}</h3>
                    <div className="pos-product-card__badges">
                      <Badge tone={stockBadgeTone(product.stockState)}>
                        {STOCK_STATE_LABELS[product.stockState]}
                      </Badge>
                      <Badge tone={product.isAvailable ? "success" : "neutral"}>
                        {product.isAvailable ? "Listed" : "Unlisted"}
                      </Badge>
                    </div>
                  </div>
                  {product.category ? (
                    <p className="pos-product-card__category">{product.category.name}</p>
                  ) : null}
                  {product.description ? (
                    <p className="pos-product-card__desc">{product.description}</p>
                  ) : null}
                  <p className="pos-product-card__price">
                    {formatMoney(product.unitPriceCents)}
                    {product.stockQuantity != null ? (
                      <span className="pos-muted"> · Qty {product.stockQuantity}</span>
                    ) : null}
                  </p>
                  {canManageProducts ? (
                    <div className="pos-product-card__actions">
                      <AvailabilityToggle
                        available={product.isAvailable}
                        disabled={saving || disabled}
                        onChange={() => onToggleAvailability(product)}
                      />
                      <div className="pos-stock-quick">
                        {(
                          ["in_stock", "low_stock", "out_of_stock"] as const
                        ).map((state) => (
                          <Button
                            key={state}
                            type="button"
                            variant={
                              product.stockState === state ? "primary" : "secondary"
                            }
                            size="sm"
                            disabled={saving}
                            onClick={() => onStockStateChange(product, state)}
                          >
                            {STOCK_STATE_LABELS[state]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </>
  );
}
