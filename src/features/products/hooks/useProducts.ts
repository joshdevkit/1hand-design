import { useBackend } from "@/app/providers/ConvexProvider";
import { useUserId } from "@/lib/auth";
import { useAsync } from "@/hooks/useAsync";
import type { Product } from "@/types";

export function useProducts() {
  const backend = useBackend();
  const userId = useUserId();

  return useAsync<Product[]>(() => backend.products.list(), [backend, userId]);
}

export function useProduct(productId: string | undefined) {
  const backend = useBackend();
  return useAsync<Product | null>(
    () => (productId ? backend.products.get(productId) : Promise.resolve(null)),
    [backend, productId],
  );
}
