import { getCartStorageKey, LEGACY_CART_STORAGE_KEY } from "./config";

export interface CartItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export function emptyCart(): CartState {
  return { items: [] };
}

function parseCartState(raw: string): CartState {
  try {
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.items)) {
      return emptyCart();
    }
    return {
      items: parsed.items.filter(
        (item) =>
          item &&
          typeof item.productId === "string" &&
          typeof item.name === "string" &&
          typeof item.unitPriceCents === "number" &&
          typeof item.quantity === "number" &&
          item.quantity > 0,
      ),
    };
  } catch {
    return emptyCart();
  }
}

export function readCartFromStorage(merchantSlug: string): CartState {
  if (typeof window === "undefined") {
    return emptyCart();
  }

  const scoped = localStorage.getItem(getCartStorageKey(merchantSlug));
  if (scoped) {
    return parseCartState(scoped);
  }

  const legacy = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
  if (legacy) {
    return parseCartState(legacy);
  }

  return emptyCart();
}

export function writeCartToStorage(merchantSlug: string, cart: CartState): void {
  localStorage.setItem(getCartStorageKey(merchantSlug), JSON.stringify(cart));
}

export function clearCartStorage(merchantSlug: string): void {
  localStorage.removeItem(getCartStorageKey(merchantSlug));
}

export function getCartItemCount(cart: CartState): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotalCents(cart: CartState): number {
  return cart.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
}

export function addProductToCart(
  cart: CartState,
  product: { id: string; name: string; unitPriceCents: number },
): CartState {
  const existing = cart.items.find((item) => item.productId === product.id);
  if (existing) {
    return {
      items: cart.items.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
          : item,
      ),
    };
  }
  return {
    items: [
      ...cart.items,
      {
        productId: product.id,
        name: product.name,
        unitPriceCents: product.unitPriceCents,
        quantity: 1,
      },
    ],
  };
}

export function updateCartItemQuantity(
  cart: CartState,
  productId: string,
  quantity: number,
): CartState {
  if (quantity <= 0) {
    return {
      items: cart.items.filter((item) => item.productId !== productId),
    };
  }
  return {
    items: cart.items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(quantity, 99) }
        : item,
    ),
  };
}

export function removeCartItem(cart: CartState, productId: string): CartState {
  return {
    items: cart.items.filter((item) => item.productId !== productId),
  };
}
