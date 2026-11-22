import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CAMERA_PRESETS,
  RESET_VIEW,
  type ViewPreset,
} from "@/features/three-d/types/three-d.types";

export interface CameraControllerHandle {
  setView: (view: ViewPreset) => void;
  /** Snaps the camera to a preset without animation (used for captures). */
  setViewImmediate: (view: ViewPreset) => void;
  getTarget: () => THREE.Vector3;
  setTargetImmediate: (target: THREE.Vector3) => void;
  zoomBy: (factor: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setAutoRotate: (enabled: boolean) => void;
  toggleAutoRotate: () => void;
}

const MIN_DISTANCE = 1.8;
const MAX_DISTANCE = 8;

/**
 * OrbitControls wrapper providing smooth camera presets, zoom, reset, and
 * auto-rotation. Full 360° azimuth; polar angle is clamped so the camera
 * never clips through the garment or flips over the top/bottom.
 */
export function CameraController({
  autoRotate,
  onReady,
}: {
  autoRotate: boolean;
  onReady: (handle: CameraControllerHandle) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);

  const desiredPosition = useRef<THREE.Vector3 | null>(null);
  const desiredTarget = useRef<THREE.Vector3 | null>(null);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (desiredPosition.current) {
      camera.position.lerp(desiredPosition.current, 0.14);
      controls.target.lerp(desiredTarget.current ?? new THREE.Vector3(), 0.14);
      if (camera.position.distanceTo(desiredPosition.current) < 0.02) {
        desiredPosition.current = null;
        desiredTarget.current = null;
      }
    }
    controls.update();
  });

  const setView = useCallback(
    (view: ViewPreset) => {
      const preset = view === "reset" ? RESET_VIEW : CAMERA_PRESETS[view];
      desiredPosition.current = new THREE.Vector3(...preset.position);
      desiredTarget.current = new THREE.Vector3(...preset.target);
    },
    [],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const distance = offset.length();
      const nextDistance = THREE.MathUtils.clamp(
        distance * factor,
        MIN_DISTANCE,
        MAX_DISTANCE,
      );
      const direction = offset.normalize();
      desiredPosition.current = controls.target.clone().addScaledVector(direction, nextDistance);
      desiredTarget.current = null;
    },
    [camera],
  );

  const setViewImmediate = useCallback((view: ViewPreset) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const preset = view === "reset" ? RESET_VIEW : CAMERA_PRESETS[view];
    camera.position.set(...preset.position);
    controls.target.set(...preset.target);
    controls.update();
  }, [camera]);

  const getTarget = useCallback(() => controlsRef.current?.target.clone() ?? new THREE.Vector3(), []);

  const setTargetImmediate = useCallback((target: THREE.Vector3) => {
    controlsRef.current?.target.copy(target);
    controlsRef.current?.update();
  }, []);

  const zoomIn = useCallback(() => zoomBy(0.85), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 0.85), [zoomBy]);

  const resetView = useCallback(() => setView("reset"), [setView]);

  const setAutoRotate = useCallback((enabled: boolean) => {
    autoRotateRef.current = enabled;
    const controls = controlsRef.current;
    if (controls) controls.autoRotate = enabled;
  }, []);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate(!autoRotateRef.current);
  }, [setAutoRotate]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (controls) controls.autoRotate = autoRotate;
  }, [autoRotate]);

  const handle = useMemo<CameraControllerHandle>(
    () => ({
      setView,
      setViewImmediate,
      getTarget,
      setTargetImmediate,
      zoomBy,
      zoomIn,
      zoomOut,
      resetView,
      setAutoRotate,
      toggleAutoRotate,
    }),
    [
      setView,
      setViewImmediate,
      getTarget,
      setTargetImmediate,
      zoomBy,
      zoomIn,
      zoomOut,
      resetView,
      setAutoRotate,
      toggleAutoRotate,
    ],
  );

  useEffect(() => {
    onReady(handle);
  }, [handle, onReady]);

  return (
    <OrbitControls
      ref={controlsRef as never}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI - 0.25}
      autoRotate={autoRotate}
      autoRotateSpeed={1.1}
      target={[0, 0.5, 0]}
    />
  );
}
