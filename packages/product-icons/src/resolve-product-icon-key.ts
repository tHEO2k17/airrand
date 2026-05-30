export const PRODUCT_ICON_KEYS = [
  "cup",
  "bottle",
  "cookie",
  "croissant",
  "pill",
  "spray",
  "package",
  "basket",
  "shirt",
  "plug",
  "smartphone",
  "scissors",
  "utensils",
  "generic",
] as const;

export type ProductIconKey = (typeof PRODUCT_ICON_KEYS)[number];

const KEYWORD_RULES: Array<{ pattern: RegExp; key: ProductIconKey }> = [
  {
    pattern:
      /\b(medicine|pharmacy|tablet|pill|capsule|pain relief|otc|wellness|ibuprofen|paracetamol|aspirin)\b/i,
    key: "pill",
  },
  {
    pattern: /\b(beauty|salon|haircut|cosmetic|makeup|scissors|grooming)\b/i,
    key: "scissors",
  },
  {
    pattern: /\b(detergent|sanitizer|soap|toiletries|spray|cleaner|hygiene)\b/i,
    key: "spray",
  },
  {
    pattern: /\b(grocery|groceries|basket|produce|vegetable|fruit|carton)\b/i,
    key: "basket",
  },
  { pattern: /\b(rice|grain|pasta|flour|maize|package|pack)\b/i, key: "package" },
  { pattern: /\b(laundry|wash|shirt|linen)\b/i, key: "shirt" },
  {
    pattern:
      /\b(electronic|charger|cable|plug|battery|phone|smartphone|laptop|adapter|device)\b/i,
    key: "smartphone",
  },
  { pattern: /\b(bread|croissant|bakery|pastry|baguette)\b/i, key: "croissant" },
  { pattern: /\b(snack|chip|cookie|biscuit|candy|nuts)\b/i, key: "cookie" },
  {
    pattern:
      /\b(drink|coffee|brew|tea|soda|water|juice|espresso|latte|cola|beverage)\b/i,
    key: "cup",
  },
  { pattern: /\b(beer|wine|bottle)\b/i, key: "bottle" },
  { pattern: /\b(meal|food|lunch|dinner|plate|utensil)\b/i, key: "utensils" },
];

const CATEGORY_ICON_KEY_MAP: Record<string, ProductIconKey> = {
  cup: "cup",
  cookie: "cookie",
  sparkles: "spray",
  "heart-pulse": "pill",
  shirt: "shirt",
};

const CATEGORY_NAME_RULES: Array<{ pattern: RegExp; key: ProductIconKey }> = [
  { pattern: /\b(drink|beverage)\b/i, key: "cup" },
  { pattern: /\b(snack)\b/i, key: "cookie" },
  { pattern: /\b(toiletries?)\b/i, key: "spray" },
  { pattern: /\b(beauty|salon)\b/i, key: "scissors" },
  { pattern: /\b(otc|wellness|medicine|pharmacy)\b/i, key: "pill" },
  { pattern: /\b(laundry)\b/i, key: "shirt" },
  { pattern: /\b(groceries?)\b/i, key: "basket" },
  { pattern: /\b(electronics?)\b/i, key: "smartphone" },
];

export type ProductIconInput = {
  productName: string;
  categoryName?: string | null;
  categoryIconKey?: string | null;
};

export function resolveProductIconKey(input: ProductIconInput): ProductIconKey {
  const name = input.productName.trim();
  const categoryName = input.categoryName?.trim() ?? "";
  const haystack = `${name} ${categoryName}`.trim();

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(haystack)) {
      return rule.key;
    }
  }

  const iconKey = input.categoryIconKey?.trim().toLowerCase();
  if (iconKey && iconKey in CATEGORY_ICON_KEY_MAP) {
    return CATEGORY_ICON_KEY_MAP[iconKey]!;
  }

  for (const rule of CATEGORY_NAME_RULES) {
    if (categoryName && rule.pattern.test(categoryName)) {
      return rule.key;
    }
  }

  return "generic";
}
