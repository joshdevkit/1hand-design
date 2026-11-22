import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Stylized garment silhouette used for catalog/design thumbnails. */
export function GarmentThumb({
  product,
  className,
}: {
  product: Pick<Product, "category">;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <path
        d="M42 18 L20 30 L14 52 L26 60 L26 122 Q26 126 30 126 L90 126 Q94 126 94 122 L94 60 L106 52 L100 30 L78 18 Q72 26 60 26 Q48 26 42 18 Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 18 Q60 30 72 18"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-center justify-center bg-surface-2 px-6 pt-8">
        <GarmentThumb product={product} className="h-36 w-auto text-foreground" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold leading-tight">{product.name}</h3>
            <p className="mt-1 text-xs text-muted-fg">{product.category}</p>
          </div>
          <span className="shrink-0 font-display text-sm font-semibold">
            {formatPrice(product.priceCents)}
          </span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-fg">{product.description}</p>

        <div className="mt-auto flex items-center gap-1.5">
          {product.colors.slice(0, 6).map((color) => (
            <span
              key={color.hex}
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
          <span className="ml-1 text-[11px] text-muted-fg">
            {product.colors.length} colors · {product.sizes.length} sizes
          </span>
        </div>

        <Link to="/studio" state={{ productId: product.id }}>
          <Button variant="outline" size="sm" className="w-full justify-center">
            Customize
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
