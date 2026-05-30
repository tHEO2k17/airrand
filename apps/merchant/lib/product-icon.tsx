import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  Cookie,
  CupSoda,
  GlassWater,
  IceCreamCone,
  Sandwich,
  UtensilsCrossed,
} from "lucide-react";

const PRODUCT_ICONS: LucideIcon[] = [
  Coffee,
  Cookie,
  CupSoda,
  Sandwich,
  IceCreamCone,
  GlassWater,
  UtensilsCrossed,
];

export function getProductIcon(name: string): LucideIcon {
  const index =
    [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    PRODUCT_ICONS.length;
  return PRODUCT_ICONS[index] ?? Coffee;
}
