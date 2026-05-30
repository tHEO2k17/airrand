import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Package,
  Pill,
  Plug,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
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
  basket: ShoppingBasket,
  shirt: Shirt,
  plug: Plug,
  smartphone: Smartphone,
  scissors: Scissors,
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
