import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { StudioLayout } from "@/components/layout/StudioLayout";
import { StudioToolbar } from "@/features/customization/components/StudioToolbar";
import { ToolSidebar } from "@/features/customization/components/ToolSidebar";
import { PropertiesPanel } from "@/features/customization/components/PropertiesPanel";
import { CustomizationWorkspace } from "@/features/customization/components/CustomizationWorkspace";
import { useCustomization } from "@/features/customization/hooks/useCustomization";
import { useRegionTextures } from "@/features/customization/hooks/useRegionTextures";
import { useProducts } from "@/features/products/hooks/useProducts";
import { useDesign } from "@/features/designs/hooks/useDesigns";
import { useBackend } from "@/app/providers/ConvexProvider";
import { useUserId } from "@/lib/auth";
import { useTheme } from "@/app/providers/ThemeProvider";
import { STUDIO_BACKGROUNDS } from "@/features/customization/utils/designConstants";
import { rehydrateElements } from "@/features/customization/utils/designUtils";
import { LoadingState } from "@/components/shared";
import type { Product } from "@/types";
import type { ViewportHandle } from "@/features/three-d/types/three-d.types";

/**
 * Design Studio — the main application. Initializes the customization store
 * from a saved design (when opened via /studio/:designId) or a fresh product,
 * and composes the toolbar, tool sidebar, 3D workspace, and properties panel.
 */
export function StudioPage() {
  const { designId } = useParams<{ designId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const backend = useBackend();
  const userId = useUserId();
  const { theme } = useTheme();

  const { data: products, loading: productsLoading } = useProducts();
  const { data: design, loading: designLoading } = useDesign(designId);

  const { product, shirtColor, autoRotate, initStudio } = useCustomization();

  const regionTextures = useRegionTextures();

  const viewportRef = useRef<ViewportHandle | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);

  const [designName, setDesignName] = useState("Design");
  const loadedDesignRef = useRef<string | null>(null);
  const productsLoadedRef = useRef(false);

  const productById = new Map((products ?? []).map((candidate) => [candidate.id, candidate]));

  // Initialize for a saved design (rehydrating artwork from stored assets).
  useEffect(() => {
    if (!design || !designId) return;
    if (loadedDesignRef.current === designId) return;

    const targetProduct = productById.get(design.productId) ?? null;
    if (!targetProduct) return;

    loadedDesignRef.current = designId;
    setDesignName(design.name);

    void (async () => {
      const assetUrls = new Map<string, string>();
      const assets = await backend.designAssets.list(userId);
      await Promise.all(
        assets.map(async (asset) => {
          const url = await backend.designAssets.getUrl(asset.id);
          if (url) assetUrls.set(asset.id, url);
        }),
      );
      const rehydrated = {
        ...design,
        config: {
          ...design.config,
          elements: rehydrateElements(design.config.elements, assetUrls),
        },
      };
      initStudio(targetProduct, rehydrated);
    })();
  }, [design, designId, productById, backend, userId, initStudio]);

  // Initialize for a fresh design: product from navigation state or catalog.
  useEffect(() => {
    if (designId) return;
    if (!products || products.length === 0) return;
    if (productsLoadedRef.current) return;
    productsLoadedRef.current = true;

    const stateProductId = (location.state as { productId?: string } | null)?.productId;
    const target =
      (stateProductId && productById.get(stateProductId)) || products[0];
    if (!target) return;

    initStudio(target);
    setDesignName(`${target.name} Design`);
  }, [products, designId, location.state, productById, initStudio]);

  const handleFullscreen = useCallback(() => {
    const element = layoutRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen();
    }
  }, []);

  if (designId && designLoading) {
    return <LoadingState label="Loading design" className="min-h-screen" />;
  }

  if (productsLoading && !product) {
    return <LoadingState label="Loading studio" className="min-h-screen" />;
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <LoadingState label="Select a product to begin" />
      </div>
    );
  }

  const background = theme === "dark" ? STUDIO_BACKGROUNDS.dark : STUDIO_BACKGROUNDS.light;

  return (
    <StudioLayout
      rootRef={layoutRef}
      toolbar={
        <StudioToolbar
          viewportRef={viewportRef}
          designId={designId ?? null}
          designName={designName}
          onDesignSaved={(id, name) => {
            setDesignName(name);
            if (designId === null) {
              loadedDesignRef.current = id;
              navigate(`/studio/${id}`);
            }
          }}
        />
      }
      leftPanel={<ToolSidebar />}
      rightPanel={<PropertiesPanel />}
    >
      <CustomizationWorkspace
        viewportRef={viewportRef}
        product={product}
        shirtColor={shirtColor}
        regionTextures={regionTextures}
        background={background}
        autoRotate={autoRotate}
        onAutoRotateChange={(enabled) => {
          viewportRef.current?.setAutoRotate(enabled);
        }}
        onFullscreen={handleFullscreen}
      />
    </StudioLayout>
  );
}
