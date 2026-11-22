import { Routes, Route, Navigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { LandingPage } from "@/app/routes/LandingPage";
import { StudioPage } from "@/app/routes/StudioPage";
import { MyDesignsPage } from "@/app/routes/MyDesignsPage";
import { CatalogPage } from "@/app/routes/CatalogPage";
import { CartPage } from "@/app/routes/CartPage";

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/studio"
          element={
            <StudioShell>
              <StudioPage />
            </StudioShell>
          }
        />
        <Route
          path="/studio/:designId"
          element={
            <StudioShell>
              <StudioPage />
            </StudioShell>
          }
        />
        <Route
          path="/catalog"
          element={
            <AppShell>
              <CatalogPage />
            </AppShell>
          }
        />
        <Route
          path="/designs"
          element={
            <AppShell>
              <MyDesignsPage />
            </AppShell>
          }
        />
        <Route
          path="/cart"
          element={
            <AppShell>
              <CartPage />
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" richColors closeButton />
    </TooltipProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

/** Studio pages manage their own chrome (toolbar + panels), so no header. */
function StudioShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-workspace">{children}</div>;
}
