import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Package,
  Pill,
  Plug,
  Shirt,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import {
  resolveProductIconKey,
  type ProductIconInput,
  type ProductIconKey,
} from "./resolve-product-icon-key.js";

const ICON_BY_KEY: Record<ProductIconKey, LucideIcon> = {
  cup: CupSoda,
  bottle: Wine,
  cookie: Cookie,
  croissant: Croissant,
  pill: Pill,
  spray: Sparkles,
  package: Package,
  shirt: Shirt,
  plug: Plug,
  utensils: UtensilsCrossed,
  generic: ShoppingBag,
};

export function getProductIconComponent(input: ProductIconInput): LucideIcon {
  const key = resolveProductIconKey(input);
  return ICON_BY_KEY[key] ?? Coffee;
}

/** @deprecated Use getProductIconComponent with category context */
export function getProductIconByName(name: string): LucideIcon {
  return getProductIconComponent({ productName: name });
}
