"use client";

import type { ProductResponse } from "@airrand/contracts";
import { Surface } from "../ui/surface";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { formatMoney } from "../../lib/format";
import { getProductIcon } from "../../lib/product-icon";

export function ProductGrid({
  products,
  saving,
  onToggleAvailability,
}: {
  products: ProductResponse[];
  saving: boolean;
  onToggleAvailability: (product: ProductResponse) => void;
}) {
  if (products.length === 0) {
    return (
      <Surface>
        <EmptyState
          title="No menu items"
          description="Add products from the Products screen to build your catalog."
        />
      </Surface>
    );
  }

  return (
    <div className="pos-product-grid">
      {products.map((product) => {
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
              <Button
                variant="secondary"
                size="sm"
                disabled={saving}
                onClick={() => onToggleAvailability(product)}
              >
                {product.isAvailable ? "Mark unavailable" : "Mark available"}
              </Button>
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
