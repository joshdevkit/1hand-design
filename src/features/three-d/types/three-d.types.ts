import type { RegionId } from "@/types";

/** Camera preset angles for the 3D viewport. */
export type ViewPreset = "front" | "back" | "left" | "right" | "reset";

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<Exclude<ViewPreset, "reset">, CameraPreset> = {
  front: { position: [0, 1.0, 4.4], target: [0, 0.5, 0] },
  back: { position: [0, 1.0, -4.4], target: [0, 0.5, 0] },
  left: { position: [-4.4, 1.0, 0.05], target: [0, 0.5, 0] },
  right: { position: [4.4, 1.0, 0.05], target: [0, 0.5, 0] },
};

export const RESET_VIEW: CameraPreset = { position: [0, 1.1, 5.0], target: [0, 0.5, 0] };

/**
 * Printable region registry.
 *
 * Each region maps to a material on the garment plus a UV rectangle defining
 * the printable area in that mesh's UV space. Design coordinates (x, y in
 * 0..1) map directly onto the region canvas; the uvRect is the printable
 * guide used for presets, clamping, and the on-shirt print guide overlay.
 */
export interface RegionDefinition {
  id: RegionId;
  label: string;
  /** [u0, u1, v0, v1] — printable rect in mesh UV space. */
  uvRect: [number, number, number, number];
}

export const REGIONS: Record<RegionId, RegionDefinition> = {
  front: { id: "front", label: "Front", uvRect: [0.04, 0.96, 0.14, 0.9] },
  back: { id: "back", label: "Back", uvRect: [0.04, 0.96, 0.12, 0.9] },
  leftSleeve: { id: "leftSleeve", label: "Left Sleeve", uvRect: [0.22, 0.78, 0.08, 0.92] },
  rightSleeve: { id: "rightSleeve", label: "Right Sleeve", uvRect: [0.22, 0.78, 0.08, 0.92] },
};

export const REGION_ORDER: RegionId[] = ["front", "back", "leftSleeve", "rightSleeve"];

/** Parameters controlling the procedural garment geometry. */
export interface GarmentParams {
  /** Overall body width scale. */
  widthScale: number;
  /** Body height. */
  height: number;
  /** Sleeve length (0 = sleeveless). */
  sleeveLength: number;
  /** Sleeve radius scale. */
  sleeveRadius: number;
  /** Neckline style. */
  neck: "crew" | "scoop" | "v";
  /** Neckline dip depth (front). */
  neckDip: number;
  /** Include hood (hoodies). */
  hood: boolean;
  /** Include front pocket (hoodies). */
  pocket: boolean;
  /** Include polo placket + buttons. */
  placket: boolean;
  /** Slightly looser, longer silhouette. */
  relaxed: boolean;
}

/** Default params per product category. */
export const GARMENT_PARAMS: Record<string, GarmentParams> = {
  "classic-t-shirt": {
    widthScale: 1, height: 2.1, sleeveLength: 0.95, sleeveRadius: 1, neck: "crew", neckDip: 0.16,
    hood: false, pocket: false, placket: false, relaxed: false,
  },
  "oversized-t-shirt": {
    widthScale: 1.14, height: 2.25, sleeveLength: 1.05, sleeveRadius: 1.12, neck: "crew", neckDip: 0.15,
    hood: false, pocket: false, placket: false, relaxed: true,
  },
  "polo-shirt": {
    widthScale: 0.98, height: 2.1, sleeveLength: 0.95, sleeveRadius: 0.95, neck: "crew", neckDip: 0.1,
    hood: false, pocket: false, placket: true, relaxed: false,
  },
  "long-sleeve": {
    widthScale: 1, height: 2.15, sleeveLength: 1.5, sleeveRadius: 0.95, neck: "crew", neckDip: 0.15,
    hood: false, pocket: false, placket: false, relaxed: false,
  },
  hoodie: {
    widthScale: 1.1, height: 2.3, sleeveLength: 1.1, sleeveRadius: 1.08, neck: "crew", neckDip: 0.12,
    hood: true, pocket: true, placket: false, relaxed: true,
  },
  sweatshirt: {
    widthScale: 1.06, height: 2.2, sleeveLength: 1.05, sleeveRadius: 1.04, neck: "crew", neckDip: 0.13,
    hood: false, pocket: false, placket: false, relaxed: true,
  },
  "tank-top": {
    widthScale: 0.94, height: 2.0, sleeveLength: 0, sleeveRadius: 0, neck: "scoop", neckDip: 0.3,
    hood: false, pocket: false, placket: false, relaxed: false,
  },
};

export function garmentParamsForProduct(productId: string): GarmentParams {
  return GARMENT_PARAMS[productId] ?? GARMENT_PARAMS["classic-t-shirt"];
}

/** Imperative API exposed by the 3D viewport to the studio toolbar. */
export interface ViewportHandle {
  setView: (view: ViewPreset) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setAutoRotate: (enabled: boolean) => void;
  toggleAutoRotate: () => void;
  captureViewport: (view: "current" | "front" | "back") => Promise<string | null>;
}
