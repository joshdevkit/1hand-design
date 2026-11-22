import { useState } from "react";
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useCart, useCartService } from "@/features/cart/hooks/useCart";
import { useBackend } from "@/app/providers/ConvexProvider";
import { useUserId } from "@/lib/auth";
import { LoadingState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { GarmentThumb } from "@/features/products/components/ProductCard";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export function CartPage() {
  const { items, loading, reload } = useCart();
  const { setQuantity, removeFromCart, clearCart } = useCartService();
  const backend = useBackend();
  const userId = useUserId();
  const [checkoutState, setCheckoutState] = useState<"idle" | "processing" | "done">("idle");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const subtotal = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutState("processing");
    try {
      const order = await backend.orders.create({
        userId,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          designId: item.designId,
          designName: item.designName,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        })),
        totalCents: subtotal,
      });
      await clearCart();
      reload();
      setLastOrderId(order.id);
      setCheckoutState("done");
      toast.success("Order placed (simulated checkout)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setCheckoutState("idle");
    }
  };

  if (checkoutState === "done") {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold">Order confirmed</h1>
        <p className="mt-2 text-sm text-muted-fg">
          Your customized apparel order was recorded (simulated checkout — no payment was processed).
          Order reference: <span className="font-mono">{lastOrderId}</span>
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => setCheckoutState("idle")}>
            View cart
          </Button>
          <Button onClick={() => (window.location.hash = "#/catalog")}>
            Browse catalog
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Checkout</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your Cart</h1>
      </header>

      {loading && <LoadingState label="Loading cart" />}

      {!loading && items.length === 0 && (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Your cart is empty"
          description="Customize a garment in the studio and add it to your cart to see it here."
          action={
            <Button onClick={() => (window.location.hash = "#/studio")}>
              Start designing
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onIncrement={() => void setQuantity(item.id, item.quantity + 1)}
                onDecrement={() => void setQuantity(item.id, Math.max(1, item.quantity - 1))}
                onRemove={() => {
                  void removeFromCart(item.id).then(() => {
                    toast.success("Item removed");
                    reload();
                  });
                }}
              />
            ))}
            <Button variant="ghost" size="sm" className="text-muted-fg" onClick={() => void clearCart().then(reload)}>
              Clear cart
            </Button>
          </div>

          <aside className="h-fit space-y-4 rounded-xl border border-border bg-surface p-5 shadow-subtle lg:sticky lg:top-20">
            <h2 className="font-display text-sm font-semibold">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-fg">
                <span>Items</span>
                <span>{items.reduce((total, item) => total + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-muted-fg">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-fg">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-medium">Total</span>
              <span className="font-display text-lg font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <Button
              className="w-full"
              disabled={checkoutState === "processing"}
              onClick={() => void handleCheckout()}
            >
              {checkoutState === "processing" ? "Placing order…" : "Checkout"}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-fg">
              Checkout is simulated for this build — no payment is processed. Order records are
              persisted through Convex.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: {
    id: string;
    productName: string;
    productId: string;
    size: string;
    color: string;
    quantity: number;
    unitPriceCents: number;
    designName: string | null;
    designPreview: string | null;
  };
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const product: Product = {
    id: item.productId,
    name: item.productName,
    description: "",
    category: "Classic T-Shirt",
    priceCents: item.unitPriceCents,
    sizes: [],
    colors: [],
    modelPath: null,
    thumbnail: null,
    active: true,
    sortOrder: 0,
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-subtle">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-foreground">
        {item.designPreview ? (
          <img src={item.designPreview} alt="" className="h-full w-full object-cover" />
        ) : (
          <GarmentThumb product={product} className="h-16 w-auto" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-sm font-semibold">{item.productName}</h3>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-fg">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: item.color }} />
            {item.color}
          </span>
          <span>Size {item.size}</span>
          {item.designName && <span className="truncate">Design: {item.designName}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="font-display text-sm font-semibold">
          {formatPrice(item.unitPriceCents * item.quantity)}
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={onDecrement}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-fg hover:bg-surface-2"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
          <button
            onClick={onIncrement}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-fg hover:bg-surface-2"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-[11px] text-muted-fg hover:text-danger"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      </div>
    </div>
  );
}
