import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Layers,
  Palette,
  UploadCloud,
  Type,
  Layers3,
  Rotate3d,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ShirtCanvas } from "@/features/three-d/components/ShirtCanvas";
import { useProducts } from "@/features/products/hooks/useProducts";
import { GarmentThumb } from "@/features/products/components/ProductCard";
import { APPAREL_CATEGORIES, BRAND } from "@/lib/constants";
import { OfflineBanner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/providers/ThemeProvider";
import { STUDIO_BACKGROUNDS } from "@/features/customization/utils/designConstants";

/** Live 3D shirt for the hero — real WebGL, continuously rotating. */
function HeroShirt() {
  const { data: products } = useProducts();
  const { theme } = useTheme();
  const product = useMemo(() => products?.[0] ?? null, [products]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-workspace sm:h-[520px]">
      {product && (
        <ShirtCanvas
          product={product}
          shirtColor="#F4F4F5"
          regionTextures={{}}
          background={theme === "dark" ? STUDIO_BACKGROUNDS.dark : STUDIO_BACKGROUNDS.light}
          autoRotate
        />
      )}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-border bg-surface/85 px-3 py-1 text-[11px] font-medium text-muted-fg shadow-sm backdrop-blur">
        Live 3D · drag to rotate
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: Layers,
    title: "Pick a garment",
    description:
      "Choose from seven apparel silhouettes — each with its own 3D model, color palette, and printable surfaces.",
  },
  {
    icon: Palette,
    title: "Recolor in real time",
    description:
      "Apply any color to the actual 3D fabric and watch the material update instantly as you rotate the shirt.",
  },
  {
    icon: UploadCloud,
    title: "Place your artwork",
    description:
      "Upload logos, graphics, and text. Position them on the front, back, or sleeves with true UV mapping.",
  },
  {
    icon: Rotate3d,
    title: "Inspect in 360°",
    description:
      "Rotate, zoom, and check every angle. Save your design and add the finished garment to your cart.",
  },
];

const FEATURES = [
  {
    icon: Layers3,
    title: "Real 3D garment engine",
    description:
      "React Three Fiber renders actual shirt geometry with UV-mapped print regions — no static images, no fake rotation.",
  },
  {
    icon: Palette,
    title: "True fabric materials",
    description:
      "Colors, opacity, and textures apply to the garment material itself and stay synchronized with your saved design.",
  },
  {
    icon: Type,
    title: "Text & graphics studio",
    description:
      "Type tools, a built-in graphics library, layer management, and undo/redo — a complete design workflow in the browser.",
  },
  {
    icon: Sparkles,
    title: "Convex-powered persistence",
    description:
      "Designs, assets, cart, and orders are stored through Convex with real-time sync and strict backend validation.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <AppHeader />

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="animate-fade-up space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-fg shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              3D apparel customization studio
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Design apparel in
              <br />
              <span className="text-accent">real-time 3D</span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-fg sm:text-base">
              {BRAND.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/studio">
                <Button size="lg">
                  <Layers className="h-4 w-4" />
                  Start Designing
                </Button>
              </Link>
              <Link to="/catalog">
                <Button size="lg" variant="outline">
                  Explore Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <HeroShirt />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-subtle sm:p-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Catalog</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                Featured apparel categories
              </h2>
            </div>
            <Link to="/catalog" className="hidden text-sm font-medium text-accent hover:underline sm:block">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {APPAREL_CATEGORIES.map((category) => (
              <Link
                key={category}
                to="/catalog"
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-2/50 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-card"
              >
                <span className="text-foreground opacity-80 transition-opacity group-hover:opacity-100">
                  <GarmentThumb product={{ category }} className="h-14 w-auto" />
                </span>
                <span className="text-[11px] font-medium leading-tight text-muted-fg group-hover:text-foreground">
                  {category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-pad mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Workflow</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-xl border border-border bg-surface p-5 shadow-subtle"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft/60 text-accent">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-[11px] text-muted-fg">0{index + 1}</span>
              <h3 className="mt-1 font-display text-sm font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-fg">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 rounded-xl border border-border bg-surface p-6 shadow-subtle"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-fg">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-workspace p-10 text-center">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next garment starts here
          </h2>
          <p className="max-w-md text-sm text-muted-fg">
            Open the studio and customize a real 3D shirt — rotate it, recolor it, and place your
            own designs on it in minutes.
          </p>
          <Link to="/studio">
            <Button size="lg">
              <ShoppingBag className="h-4 w-4" />
              Start Designing
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent font-display text-xs font-bold text-accent-fg">
              T
            </span>
            <span className="font-display text-sm font-semibold tracking-[0.18em]">
              {BRAND.name}
            </span>
          </div>
          <p className="text-xs text-muted-fg">
            3D apparel customization studio · Convex-backed · Built with React Three Fiber
          </p>
        </div>
      </footer>
    </div>
  );
}
