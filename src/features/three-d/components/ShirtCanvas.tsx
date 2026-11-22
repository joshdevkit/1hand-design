import {
  forwardRef,
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { Product, RegionId } from "@/types";
import { useShirtModel } from "@/features/three-d/hooks/useShirtModel";
import {
  CameraController,
  type CameraControllerHandle,
} from "@/features/three-d/components/CameraController";
import { ShirtModel } from "@/features/three-d/components/ShirtModel";
import { type ViewPreset, type ViewportHandle } from "@/features/three-d/types/three-d.types";

export interface ShirtCanvasProps {
  product: Product | null;
  shirtColor: string;
  regionTextures: Partial<Record<RegionId, THREE.CanvasTexture | null>>;
  background: string;
  autoRotate: boolean;
  onModelStatus?: (status: "idle" | "loading" | "ready" | "error") => void;
}

function waitForFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

/**
 * The interactive 3D viewport: R3F canvas, lighting, contact shadows, the
 * garment model, and camera controls. Exposes an imperative ViewportHandle
 * for the studio toolbar (presets, zoom, auto-rotate, capture).
 */
export const ShirtCanvas = forwardRef<ViewportHandle, ShirtCanvasProps>(function ShirtCanvas(
  { product, shirtColor, regionTextures, background, autoRotate, onModelStatus },
  ref,
) {
  const { group, status } = useShirtModel(product, { shirtColor, regionTextures });

  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controllerRef = useRef<CameraControllerHandle | null>(null);

  const setView = useCallback((view: ViewPreset) => {
    controllerRef.current?.setView(view);
  }, []);

  const captureViewport = useCallback(
    async (view: "current" | "front" | "back"): Promise<string | null> => {
      const gl = glRef.current;
      const camera = cameraRef.current;
      const controls = controllerRef.current;
      if (!gl || !camera || !controls) return null;

      const previousPosition = camera.position.clone();
      const previousTarget = controls.getTarget();

      if (view === "front" || view === "back") {
        controls.setViewImmediate(view);
      }

      await waitForFrames(5);
      const dataUrl = gl.domElement.toDataURL("image/png");

      // Restore the previous camera state.
      camera.position.copy(previousPosition);
      controls.setTargetImmediate(previousTarget);
      await waitForFrames(2);
      return dataUrl;
    },
    [],
  );

  useImperativeHandle(
    ref,
    (): ViewportHandle => ({
      setView,
      zoomIn: () => controllerRef.current?.zoomIn(),
      zoomOut: () => controllerRef.current?.zoomOut(),
      resetView: () => controllerRef.current?.resetView(),
      setAutoRotate: (enabled: boolean) => controllerRef.current?.setAutoRotate(enabled),
      toggleAutoRotate: () => controllerRef.current?.toggleAutoRotate(),
      captureViewport,
    }),
    [setView, captureViewport],
  );

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: false,
      }}
      camera={{ position: [0, 1.1, 5.0], fov: 38 }}
      onCreated={({ gl, camera }) => {
        glRef.current = gl;
        cameraRef.current = camera as THREE.PerspectiveCamera;
      }}
    >
      <color attach="background" args={[background]} />
      <hemisphereLight intensity={0.6} groundColor="#d8dbe2" color="#ffffff" />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.3} />

      <Suspense fallback={null}>{group && <ShirtModel object={group} />}</Suspense>

      <ContactShadows
        position={[0, -0.62, 0]}
        opacity={0.4}
        scale={10}
        blur={2.8}
        far={4.5}
        resolution={512}
      />

      <CameraController
        autoRotate={autoRotate}
        onReady={(handle) => {
          controllerRef.current = handle;
        }}
      />
    </Canvas>
  );
});
