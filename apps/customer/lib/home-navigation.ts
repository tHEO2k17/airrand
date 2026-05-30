export type HomeBrowseTab = "products" | "shops";

export const HOME_BROWSE_TABS: Array<{ id: HomeBrowseTab; label: string }> = [
  { id: "products", label: "Browse" },
  { id: "shops", label: "Shops" },
];

export function isHomeBrowseTab(value: string): value is HomeBrowseTab {
  return value === "products" || value === "shops";
}

export function defaultHomeBrowseTab(): HomeBrowseTab {
  return "products";
}
