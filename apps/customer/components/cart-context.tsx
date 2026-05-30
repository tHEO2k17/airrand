"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addProductToCart,
  clearCartStorage,
  getCartItemCount,
  getCartSubtotalCents,
  readCartFromStorage,
  removeCartItem,
  updateCartItemQuantity,
  writeCartToStorage,
  type CartItem,
  type CartState,
} from "../lib/cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addProduct: (product: {
    id: string;
    name: string;
    unitPriceCents: number;
  }) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  merchantSlug,
  children,
}: {
  merchantSlug: string;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartState>({ items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readCartFromStorage(merchantSlug));
    setHydrated(true);
  }, [merchantSlug]);

  const updateCart = useCallback(
    (updater: (current: CartState) => CartState) => {
      setCart((current) => {
        const next = updater(current);
        writeCartToStorage(merchantSlug, next);
        return next;
      });
    },
    [merchantSlug],
  );

  const addProduct = useCallback(
    (product: { id: string; name: string; unitPriceCents: number }) => {
      updateCart((current) => addProductToCart(current, product));
    },
    [updateCart],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      updateCart((current) => updateCartItemQuantity(current, productId, quantity));
    },
    [updateCart],
  );

  const removeItem = useCallback(
    (productId: string) => {
      updateCart((current) => removeCartItem(current, productId));
    },
    [updateCart],
  );

  const clearCart = useCallback(() => {
    clearCartStorage(merchantSlug);
    setCart({ items: [] });
  }, [merchantSlug]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart.items,
      itemCount: getCartItemCount(cart),
      subtotalCents: getCartSubtotalCents(cart),
      hydrated,
      addProduct,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [cart, hydrated, addProduct, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
