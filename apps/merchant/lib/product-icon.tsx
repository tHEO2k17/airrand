import type { ProductResponse } from "@airrand/contracts";
import type { LucideIcon } from "lucide-react";
import { getProductIconComponent } from "@airrand/product-icons/react";

export function getProductIcon(
  product: Pick<ProductResponse, "name" | "category">,
): LucideIcon {
  return getProductIconComponent({
    productName: product.name,
    categoryName: product.category?.name,
    categoryIconKey: product.category?.iconKey,
  });
}

export function getProductIconByName(name: string): LucideIcon {
  return getProductIconComponent({ productName: name });
}
