import { useMemo, useState } from "react";
import { Shirt } from "lucide-react";
import { useProducts } from "@/features/products/hooks/useProducts";
import { ProductCard } from "@/features/products/components/ProductCard";
import { APPAREL_CATEGORIES } from "@/lib/constants";
import { LoadingState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CatalogPage() {
  const { data: products, loading, error } = useProducts();
  const [category, setCategory] = useState<string>("All");

  const visible = useMemo(() => {
    if (!products) return [];
    const filtered =
      category === "All" ? products : products.filter((product) => product.category === category);
    return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [products, category]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Apparel Catalog</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Garments built for customization
        </h1>
        <p className="max-w-2xl text-sm text-muted-fg">
          Every product ships with its own 3D model, color palette, and printable surfaces. Pick a
          garment and open it in the studio to start designing.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {["All", ...APPAREL_CATEGORIES].map((option) => (
          <button
            key={option}
            onClick={() => setCategory(option)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              category === option
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-surface text-muted-fg hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {loading && <LoadingState label="Loading catalog" />}
      {error && (
        <EmptyState
          icon={<Shirt className="h-5 w-5" />}
          title="Catalog unavailable"
          description={error.message}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      )}
      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={<Shirt className="h-5 w-5" />}
          title="No products in this category"
          description="Try selecting a different category."
        />
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
