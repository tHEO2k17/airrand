"use client";

import { useMemo, useState } from "react";
import type { ProductResponse } from "@airrand/contracts";
import { AvailabilityToggle } from "../ui/availability-toggle";
import { Surface } from "../ui/surface";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import { formatMoney } from "../../lib/format";
import { getProductIcon } from "../../lib/product-icon";
import { MenuToolbar } from "./menu-toolbar";

export function ProductGrid({
  products,
  saving,
  canManageProducts = true,
  onToggleAvailability,
}: {
  products: ProductResponse[];
  saving: boolean;
  canManageProducts?: boolean;
  onToggleAvailability: (product: ProductResponse) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return products;
    }
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    );
  }, [products, query]);

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
            const Icon = getProductIcon(product.name);
            return (
              <Surface key={product.id} padding="md" className="pos-product-card">
                <div className="pos-product-card__icon" aria-hidden>
                  <Icon size={26} strokeWidth={1.75} />
                </div>
                <div className="pos-product-card__body">
                  <div className="pos-product-card__head">
                    <h3 className="pos-product-card__name">{product.name}</h3>
                    <Badge tone={product.isAvailable ? "success" : "neutral"}>
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  {product.description ? (
                    <p className="pos-product-card__desc">{product.description}</p>
                  ) : null}
                  <p className="pos-product-card__price">
                    {formatMoney(product.unitPriceCents)}
                  </p>
                  {canManageProducts ? (
                    <AvailabilityToggle
                      available={product.isAvailable}
                      disabled={saving}
                      onChange={() => onToggleAvailability(product)}
                    />
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
