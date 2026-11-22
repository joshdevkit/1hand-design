import type { DesignElement, DesignRecord, RegionId } from "@/types";
import { uid } from "@/lib/utils";

/** Quick positioning presets mapped to region-normalized coordinates. */
export const POSITION_PRESETS: Array<{
  id: string;
  label: string;
  region: RegionId;
  x: number;
  y: number;
}> = [
  { id: "front-chest", label: "Front Chest", region: "front", x: 0.5, y: 0.42 },
  { id: "front-center", label: "Front Center", region: "front", x: 0.5, y: 0.55 },
  { id: "front-lower", label: "Front Lower", region: "front", x: 0.5, y: 0.75 },
  { id: "back-center", label: "Back Center", region: "back", x: 0.5, y: 0.5 },
  { id: "back-upper", label: "Back Upper", region: "back", x: 0.5, y: 0.35 },
  { id: "left-sleeve", label: "Left Sleeve", region: "leftSleeve", x: 0.5, y: 0.5 },
  { id: "right-sleeve", label: "Right Sleeve", region: "rightSleeve", x: 0.5, y: 0.5 },
];

export function presetFor(presetId: string): (typeof POSITION_PRESETS)[number] | undefined {
  return POSITION_PRESETS.find((preset) => preset.id === presetId);
}

export function nextZIndex(elements: DesignElement[]): number {
  return elements.reduce((max, element) => Math.max(max, element.zIndex), 0) + 1;
}

export function elementDisplayName(element: DesignElement, index: number): string {
  if (element.kind === "text") return `Text ${index}`;
  if (element.kind === "graphic") return `Graphic ${index}`;
  return element.name || `Artwork ${index}`;
}

export interface ArtworkElementInput {
  imageData: string;
  name: string;
  region: RegionId;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  assetId?: string;
}

export function createArtworkElement(input: ArtworkElementInput): DesignElement {
  const width = input.width ?? 0.5;
  return {
    id: uid("el"),
    name: input.name,
    kind: "artwork",
    region: input.region,
    x: input.x ?? 0.5,
    y: input.y ?? 0.5,
    width,
    height: width,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: nextZIndex([]),
    imageData: input.imageData,
    assetId: input.assetId,
  };
}

export interface TextElementInput {
  region: RegionId;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function createTextElement(input: TextElementInput): DesignElement {
  return {
    id: uid("el"),
    name: "Text",
    kind: "text",
    region: input.region,
    x: input.x ?? 0.5,
    y: input.y ?? 0.5,
    width: input.width ?? 0.6,
    height: input.height ?? 0.2,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: nextZIndex([]),
    text: {
      content: "Your Text",
      fontFamily: "Inter",
      fontSize: 18,
      fontWeight: 700,
      italic: false,
      color: "#17191D",
      align: "center",
      letterSpacing: 0,
      lineHeight: 110,
      backgroundColor: null,
    },
  };
}

export interface GraphicElementInput {
  graphicId: string;
  region: RegionId;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function createGraphicElement(input: GraphicElementInput): DesignElement {
  return {
    id: uid("el"),
    name: "Graphic",
    kind: "graphic",
    region: input.region,
    x: input.x ?? 0.5,
    y: input.y ?? 0.5,
    width: input.width ?? 0.3,
    height: input.height ?? 0.3,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: nextZIndex([]),
    graphicId: input.graphicId,
    text: {
      content: "",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: 400,
      italic: false,
      color: input.color ?? "#17191D",
      align: "center",
      letterSpacing: 0,
      lineHeight: 110,
      backgroundColor: null,
    },
  };
}

/** Strips in-memory image data for persistence; keeps asset references. */
export function serializeElements(elements: DesignElement[]): DesignElement[] {
  return elements.map((element) => {
    if (element.kind !== "artwork") return element;
    const { imageData: _imageData, ...rest } = element;
    void _imageData;
    return rest;
  });
}

/**
 * Rehydrates persisted elements with artwork data URLs resolved from stored
 * assets. Elements without a resolvable asset keep their metadata.
 */
export function rehydrateElements(
  elements: DesignElement[],
  assetUrls: Map<string, string>,
): DesignElement[] {
  return elements.map((element) => {
    if (element.kind === "artwork" && element.assetId) {
      const url = assetUrls.get(element.assetId);
      if (url) return { ...element, imageData: url };
    }
    return element;
  });
}

export function defaultDesignName(productName: string): string {
  return `${productName} Design`;
}

/** Builds the persisted design record shape from studio state. */
export function toDesignRecordInput(
  partial: Pick<DesignRecord, "name" | "productId" | "productType" | "shirtColor" | "config">,
  assetIds: string[],
): Omit<DesignRecord, "id" | "userId" | "createdAt" | "updatedAt" | "previewFrontId" | "previewBackId"> {
  return {
    name: partial.name,
    productId: partial.productId,
    productType: partial.productType,
    shirtColor: partial.shirtColor,
    config: {
      shirtColor: partial.shirtColor,
      elements: serializeElements(partial.config.elements),
    },
    assetIds,
  };
}
