import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, Layers, Sun, Moon } from "lucide-react";
import { NAV_LINKS, BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useCartCount } from "@/features/cart/hooks/useCart";
import { useBackendOnline } from "@/app/providers/ConvexProvider";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const cartCount = useCartCount();
  const online = useBackendOnline();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-accent-fg">
            T
          </span>
          <span className="font-display text-[15px] font-semibold tracking-[0.18em]">
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-surface-2 text-foreground" : "text-muted-fg hover:text-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {!online && (
            <span className="hidden rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning sm:inline-flex">
              Offline mode
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <NavLink
            to="/cart"
            className={cn(
              "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-fg transition-colors hover:bg-surface-2 hover:text-foreground",
              location.pathname.startsWith("/cart") && "text-foreground",
            )}
            aria-label="Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
                {cartCount}
              </span>
            )}
          </NavLink>
          <Link to="/studio" className="ml-1">
            <Button size="sm">
              <Layers className="h-4 w-4" />
              Start Designing
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
