"use client";

import Link from "next/link";
import { getProductIconComponent } from "@airrand/product-icons/react";
import type { CatalogProduct } from "../lib/catalog-discovery";
import { buildStorePath } from "../lib/store-paths";
import { formatMoney } from "../lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Surface } from "./ui/surface";

export function CatalogProductCard({
  item,
  onAdd,
  added,
  showMerchant = true,
}: {
  item: CatalogProduct;
  onAdd?: () => void;
  added?: boolean;
  showMerchant?: boolean;
}) {
  const { product, merchantName, merchantSlug } = item;
  const Icon = getProductIconComponent({
    productName: product.name,
    categoryName: product.category?.name,
    categoryIconKey: product.category?.iconKey,
  });
  const outOfStock = product.stockState === "out_of_stock";
  const lowStock = product.stockState === "low_stock";
  const storePath = buildStorePath(merchantSlug);

  return (
    <Surface
      className={`store-product-card store-product-card--commerce${outOfStock ? " store-product-card--out-of-stock" : ""}${lowStock ? " store-product-card--low-stock" : ""}`}
      padding="lg"
    >
      <div className="store-product-card__top">
        <div className="store-product-card__icon" aria-hidden>
          <Icon size={26} strokeWidth={1.75} />
        </div>
        <div className="store-product-card__body">
          <h2 className="store-product-card__name">{product.name}</h2>
          <div className="store-product-card__meta">
            {product.category ? (
              <span className="store-product-card__category">
                {product.category.name}
              </span>
            ) : null}
            {showMerchant ? (
              <Link href={storePath} className="store-product-card__merchant">
                {merchantName}
              </Link>
            ) : null}
          </div>
          {product.description ? (
            <p className="store-product-card__desc">{product.description}</p>
          ) : null}
          <div className="store-product-card__footer">
            <p className="store-product-card__price">
              {formatMoney(product.unitPriceCents)}
            </p>
            {lowStock ? <Badge tone="accent">Low stock</Badge> : null}
            {outOfStock ? <Badge tone="neutral">Out of stock</Badge> : null}
          </div>
        </div>
      </div>
      {onAdd ? (
        <Button
          block
          variant={added ? "secondary" : "primary"}
          disabled={outOfStock || !product.isAvailable}
          onClick={onAdd}
        >
          {outOfStock
            ? "Unavailable"
            : added
              ? "Added"
              : "Add to cart"}
        </Button>
      ) : (
        <Link href={storePath}>
          <Button block variant="secondary">
            View at {merchantName}
          </Button>
        </Link>
      )}
    </Surface>
  );
}
