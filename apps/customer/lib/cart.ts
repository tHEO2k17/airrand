import { CART_STORAGE_KEY } from "./config";

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

export function readCartFromStorage(): CartState {
  if (typeof window === "undefined") {
    return emptyCart();
  }
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return emptyCart();
    }
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

export function writeCartToStorage(cart: CartState): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function clearCartStorage(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
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
