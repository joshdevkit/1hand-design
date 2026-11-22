import { useCallback } from "react";
import { useBackend } from "@/app/providers/ConvexProvider";
import { useUserId } from "@/lib/auth";
import { useAsync } from "@/hooks/useAsync";
import type { CartItem } from "@/types";
import type { AddCartItemInput } from "@/lib/backend";

export function useCart() {
  const backend = useBackend();
  const userId = useUserId();

  const { data, loading, error, reload } = useAsync<CartItem[]>(
    () => backend.cart.list(userId),
    [backend, userId],
  );

  return { items: data ?? [], loading, error, reload };
}

export function useCartCount(): number {
  const { items } = useCart();
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function useCartService() {
  const backend = useBackend();
  const userId = useUserId();

  const addToCart = useCallback(
    async (input: Omit<AddCartItemInput, "userId">) =>
      backend.cart.add({ ...input, userId }),
    [backend, userId],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => backend.cart.setQuantity(id, quantity),
    [backend],
  );

  const removeFromCart = useCallback((id: string) => backend.cart.remove(id), [backend]);

  const clearCart = useCallback(() => backend.cart.clear(userId), [backend, userId]);

  return { addToCart, setQuantity, removeFromCart, clearCart };
}
