import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewportHandle } from "@/features/three-d/types/three-d.types";

/** Touch-friendly viewport controls overlay (zoom, reset, auto-rotate). */
export function RotationControls({
  handle,
  autoRotate,
  onToggleAutoRotate,
  onFullscreen,
}: {
  handle: React.RefObject<ViewportHandle | null>;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onFullscreen: () => void;
}) {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-2">
      <Button
        variant="secondary"
        size="icon"
        className="pointer-events-auto h-9 w-9 shadow-card"
        onClick={() => handle.current?.zoomIn()}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="pointer-events-auto h-9 w-9 shadow-card"
        onClick={() => handle.current?.zoomOut()}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="pointer-events-auto h-9 w-9 shadow-card"
        onClick={() => handle.current?.resetView()}
        aria-label="Reset camera"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant={autoRotate ? "default" : "secondary"}
        size="icon"
        className={cn("pointer-events-auto h-9 w-9 shadow-card", autoRotate && "animate-[spin_3s_linear_infinite]")}
        onClick={onToggleAutoRotate}
        aria-label="Toggle auto-rotate"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
