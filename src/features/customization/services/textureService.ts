import * as THREE from "three";
import type { DesignElement, RegionId } from "@/types";
import { FONT_OPTIONS } from "@/lib/constants";
import {
  fitContain,
  fontShorthand,
  loadImage,
  roundRect,
  withRotation,
  type CanvasBox,
} from "@/features/customization/utils/canvasUtils";

/**
 * Texture service — renders design elements onto per-region canvases that
 * are applied to the garment's real materials via UV mapping. Artwork, text,
 * and graphics are composited over the shirt color on the actual shirt
 * surface, so they follow the geometry through every rotation.
 */

export const TEXTURE_SIZES: Record<RegionId, number> = {
  front: 1024,
  back: 1024,
  leftSleeve: 512,
  rightSleeve: 512,
};

export function regionElements(elements: DesignElement[], region: RegionId): DesignElement[] {
  return elements.filter((element) => element.region === region);
}

/** Draws an artwork element (uploaded image) into a box. */
async function drawArtwork(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  box: CanvasBox,
): Promise<void> {
  if (!element.imageData) return;
  const image = await loadImage(element.imageData);
  const { width, height } = fitContain(image.width, image.height, box.w, box.h);
  const x = box.x - width / 2;
  const y = box.y - height / 2;
  withRotation(ctx, box, element.rotation, () => {
    ctx.drawImage(image, x, y, width, height);
  });
}

/** Draws a text element into a box. `size` is the region canvas edge length. */
function drawText(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  box: CanvasBox,
  size: number,
): void {
  const text = element.text;
  if (!text || text.content.trim().length === 0) return;

  const sizePx = (text.fontSize / 100) * size;
  const font =
    FONT_OPTIONS.find((option) => option.label === text.fontFamily)?.family ?? text.fontFamily;
  const lineHeightPx = sizePx * (text.lineHeight / 100);
  ctx.letterSpacing = `${(text.letterSpacing / 100) * sizePx}px`;

  const lines = text.content.split("\n");
  ctx.font = fontShorthand(font, sizePx, text.fontWeight, text.italic);
  ctx.textBaseline = "middle";

  const lineWidths = lines.map((line) => ctx.measureText(line).width);
  const blockWidth = Math.max(...lineWidths, 1);
  const blockHeight = lineHeightPx * lines.length;

  // Anchor the block according to alignment, relative to the box center.
  const blockLeft =
    text.align === "center"
      ? box.x - blockWidth / 2
      : text.align === "right"
        ? box.x + box.w / 2 - blockWidth
        : box.x - box.w / 2;
  const blockTop = box.y - blockHeight / 2;

  withRotation(ctx, box, element.rotation, () => {
    if (text.backgroundColor) {
      const padding = sizePx * 0.35;
      roundRect(
        ctx,
        blockLeft - padding,
        blockTop - padding,
        blockWidth + padding * 2,
        blockHeight + padding * 2,
        sizePx * 0.25,
      );
      ctx.fillStyle = text.backgroundColor;
      ctx.fill();
    }

    ctx.fillStyle = text.color;
    ctx.textAlign = text.align;
    lines.forEach((line, index) => {
      const x =
        text.align === "center" ? box.x : text.align === "right" ? box.x + box.w / 2 : box.x - box.w / 2;
      ctx.fillText(line, x, blockTop + lineHeightPx / 2 + index * lineHeightPx);
    });
  });

  // Reset letter spacing so it doesn't leak into other elements.
  ctx.letterSpacing = "0px";
}

/** Draws a built-in graphic (SVG) into a box. */
async function drawGraphic(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  box: CanvasBox,
  graphicSvg: string | undefined,
): Promise<void> {
  if (!element.graphicId || !graphicSvg) return;
  const color = element.text?.color ?? "#17191D";
  const svg = graphicSvg.replace(/currentColor/g, color);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = await loadImage(dataUrl);
  const { width, height } = fitContain(image.width, image.height, box.w, box.h);
  const x = box.x - width / 2;
  const y = box.y - height / 2;
  withRotation(ctx, box, element.rotation, () => {
    ctx.drawImage(image, x, y, width, height);
  });
}
export interface RenderRegionOptions {
  size?: number;
  /** Optional SVG source resolver for graphic elements. */
  graphicSvg?: (graphicId: string) => string | undefined;
}

/**
 * Renders a region's print texture: shirt-color background + elements in
 * layer order. Returns a canvas ready to be wrapped into a CanvasTexture.
 */
export async function renderRegionTexture(
  region: RegionId,
  elements: DesignElement[],
  shirtColor: string,
  options: RenderRegionOptions = {},
): Promise<HTMLCanvasElement> {
  const size = options.size ?? TEXTURE_SIZES[region];
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.fillStyle = shirtColor;
  ctx.fillRect(0, 0, size, size);

  const visible = elements
    .filter((element) => element.visible && !element.locked)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const element of visible) {
    const box: CanvasBox = {
      x: element.x * size,
      y: element.y * size,
      w: element.width * size,
      h: element.height * size,
    };
    ctx.globalAlpha = Math.max(0, Math.min(1, element.opacity));
    if (element.kind === "artwork") {
      await drawArtwork(ctx, element, box);
    } else if (element.kind === "text") {
      drawText(ctx, element, box, size);
    } else if (element.kind === "graphic") {
      await drawGraphic(ctx, element, box, options.graphicSvg?.(element.graphicId ?? ""));
    }
  }
  ctx.globalAlpha = 1;

  return canvas;
}

/** Wraps a rendered canvas into a GPU texture. */
export function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/** Renders every region that has content; regions without content get null. */
export async function renderRegionTextures(
  elements: DesignElement[],
  shirtColor: string,
  regions: RegionId[],
  graphicSvg?: (graphicId: string) => string | undefined,
): Promise<Partial<Record<RegionId, THREE.CanvasTexture>>> {
  const result: Partial<Record<RegionId, THREE.CanvasTexture>> = {};
  await Promise.all(
    regions.map(async (region) => {
      const contentElements = regionElements(elements, region).filter(
        (element) => element.kind === "artwork" || element.kind === "text" || element.kind === "graphic",
      );
      if (contentElements.length === 0) return;
      const canvas = await renderRegionTexture(region, contentElements, shirtColor, { graphicSvg });
      result[region] = canvasToTexture(canvas);
    }),
  );
  return result;
}
