import type { DesignElement, RegionId } from "@/types";
import {
  renderRegionTexture,
  TEXTURE_SIZES,
} from "@/features/customization/services/textureService";
import { graphicSvgById } from "@/features/customization/services/graphicsLibrary";
import { REGION_ORDER } from "@/features/three-d/types/three-d.types";
import { downloadDataUrl } from "@/lib/utils";

/**
 * Design export service.
 *
 * Two distinct outputs, kept clearly separated:
 *  - 3D previews: rendered from the live WebGL viewport (see ShirtCanvas).
 *  - Print artwork: per-region canvas exports at texture resolution — the
 *    flat print files. These are exported at the texture's working
 *    resolution; production print-ready output requires the print-area
 *    specifications of the fulfillment provider.
 */

export interface RegionExport {
  region: RegionId;
  dataUrl: string;
  size: number;
}

/** Renders every region with content to a PNG data URL. */
export async function exportRegionArtwork(
  elements: DesignElement[],
  shirtColor: string,
): Promise<RegionExport[]> {
  const exports: RegionExport[] = [];
  for (const region of REGION_ORDER) {
    const regionElements = elements.filter(
      (element) => element.region === region && element.visible,
    );
    if (regionElements.length === 0) continue;
    const size = TEXTURE_SIZES[region];
    const canvas = await renderRegionTexture(region, regionElements, shirtColor, {
      size,
      graphicSvg: graphicSvgById,
    });
    exports.push({ region, dataUrl: canvas.toDataURL("image/png"), size });
  }
  return exports;
}

/** Downloads all region artwork exports as PNG files. */
export async function downloadRegionArtwork(
  elements: DesignElement[],
  shirtColor: string,
  designName: string,
): Promise<number> {
  const exports = await exportRegionArtwork(elements, shirtColor);
  for (const regionExport of exports) {
    downloadDataUrl(regionExport.dataUrl, `${designName}-${regionExport.region}.png`);
  }
  return exports.length;
}

/** Persists captured preview images through the backend asset pipeline. */
export async function storePreviewAssets(
  backend: {
    designAssets: {
      store: (input: {
        userId: string;
        name: string;
        kind: "preview";
        contentType: string;
        dataUrl: string;
      }) => Promise<{ id: string }>;
    };
  },
  userId: string,
  designName: string,
  frontDataUrl: string | null,
  backDataUrl: string | null,
): Promise<{ frontId: string | null; backId: string | null }> {
  const frontId = frontDataUrl
    ? (
        await backend.designAssets.store({
          userId,
          name: `${designName}-front.png`,
          contentType: "image/png",
          dataUrl: frontDataUrl,
          kind: "preview",
        })
      ).id
    : null;
  const backId = backDataUrl
    ? (
        await backend.designAssets.store({
          userId,
          name: `${designName}-back.png`,
          contentType: "image/png",
          dataUrl: backDataUrl,
          kind: "preview",
        })
      ).id
    : null;
  return { frontId, backId };
}
