import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { RegionId } from "@/types";
import { useCustomizationStore } from "@/features/customization/store/customizationStore";
import {
  canvasToTexture,
  renderRegionTexture,
} from "@/features/customization/services/textureService";
import { graphicSvgById } from "@/features/customization/services/graphicsLibrary";
import { REGION_ORDER } from "@/features/three-d/types/three-d.types";

type RegionTextures = Partial<Record<RegionId, THREE.CanvasTexture>>;

/**
 * Generates per-region print textures from the store's elements + shirt
 * color. Regeneration only happens when a region's content signature
 * changes (color, elements, transforms) — not on unrelated store updates.
 * Previously created textures are disposed when replaced.
 */
export function useRegionTextures(): RegionTextures {
  const elements = useCustomizationStore((state) => state.elements);
  const shirtColor = useCustomizationStore((state) => state.shirtColor);

  const [textures, setTextures] = useState<RegionTextures>({});
  const texturesRef = useRef<RegionTextures>(textures);
  texturesRef.current = textures;
  const signaturesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const createdThisRun: THREE.CanvasTexture[] = [];

    const run = async () => {
      const next: RegionTextures = {};

      const tasks = REGION_ORDER.map(async (region) => {
        const regionElements = elements.filter(
          (element) => element.region === region && element.visible,
        );
        const signature = `${shirtColor}|${JSON.stringify(regionElements)}`;

        if (signature === signaturesRef.current[region]) {
          if (texturesRef.current[region]) next[region] = texturesRef.current[region];
          return;
        }

        const canvas = await renderRegionTexture(region, regionElements, shirtColor, {
          graphicSvg: graphicSvgById,
        });
        const texture = canvasToTexture(canvas);
        createdThisRun.push(texture);
        signaturesRef.current[region] = signature;
        next[region] = texture;
      });

      await Promise.all(tasks);

      if (cancelled) {
        for (const texture of createdThisRun) texture.dispose();
        return;
      }

      setTextures((previous) => {
        // Dispose textures that are no longer needed.
        for (const [region, texture] of Object.entries(previous)) {
          if (!next[region as RegionId] && texture) {
            texture.dispose();
          }
        }
        return next;
      });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [elements, shirtColor]);

  return textures;
}
