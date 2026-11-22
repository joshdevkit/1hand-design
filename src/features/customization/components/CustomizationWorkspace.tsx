import { useRef } from "react";
import * as THREE from "three";
import { Loader2, Box } from "lucide-react";
import { ShirtCanvas } from "@/features/three-d/components/ShirtCanvas";
import { RotationControls } from "@/features/three-d/components/RotationControls";
import type { ViewportHandle } from "@/features/three-d/types/three-d.types";
import type { Product, RegionId } from "@/types";

export interface CustomizationWorkspaceProps {
  product: Product | null;
  shirtColor: string;
  regionTextures: Partial<Record<RegionId, THREE.CanvasTexture | null>>;
  background: string;
  autoRotate: boolean;
  onAutoRotateChange: (enabled: boolean) => void;
  onFullscreen: () => void;
  viewportRef: React.RefObject<ViewportHandle | null>;
  onModelStatus?: (status: "idle" | "loading" | "ready" | "error") => void;
}

/**
 * Center workspace — the interactive 3D editor with viewport overlays:
 * loading state, model source badge, and touch-friendly rotation controls.
 */
export function CustomizationWorkspace({
  product,
  shirtColor,
  regionTextures,
  background,
  autoRotate,
  onAutoRotateChange,
  onFullscreen,
  viewportRef,
  onModelStatus,
}: CustomizationWorkspaceProps) {
  const statusRef = useRef<"idle" | "loading" | "ready" | "error">("idle");

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-workspace">
      {product ? (
        <ShirtCanvas
          ref={viewportRef}
          product={product}
          shirtColor={shirtColor}
          regionTextures={regionTextures}
          background={background}
          autoRotate={autoRotate}
          onModelStatus={(status) => {
            statusRef.current = status;
            onModelStatus?.(status);
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-fg">
          Select a product to start designing
        </div>
      )}

      {/* Loading overlay */}
      {product && statusRef.current === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-workspace/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-muted-fg">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <p className="text-xs">Loading 3D garment…</p>
          </div>
        </div>
      )}

      {/* Model source badge */}
      {product && statusRef.current === "ready" && (
        <div className="pointer-events-none absolute left-4 top-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/85 px-2.5 py-1 text-[11px] font-medium text-muted-fg shadow-sm backdrop-blur">
            <Box className="h-3 w-3" />
            {product.modelPath ? "GLB model" : "Procedural model"}
          </span>
        </div>
      )}

      {product && (
        <RotationControls
          handle={viewportRef}
          autoRotate={autoRotate}
          onToggleAutoRotate={() => {
            const next = !autoRotate;
            viewportRef.current?.setAutoRotate(next);
            onAutoRotateChange(next);
          }}
          onFullscreen={onFullscreen}
        />
      )}
    </div>
  );
}
