import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Product, RegionId } from "@/types";
import { buildGarment } from "@/features/three-d/services/shirtGeometry";
import {
  applyRegionMaterials,
  disposeGroup,
  loadGLB,
  modelExists,
} from "@/features/three-d/services/modelService";
import { garmentParamsForProduct, REGION_ORDER } from "@/features/three-d/types/three-d.types";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface ShirtModelInput {
  shirtColor: string;
  regionTextures: Partial<Record<RegionId, THREE.CanvasTexture | null>>;
}

interface MaterialSet {
  regions: Record<RegionId, THREE.MeshStandardMaterial>;
  trim: THREE.MeshStandardMaterial;
}

function createMaterials(shirtColor: string): MaterialSet {
  const base = new THREE.Color(shirtColor);
  const trimColor = base.clone().multiplyScalar(0.82);

  const regions = {} as Record<RegionId, THREE.MeshStandardMaterial>;
  for (const region of REGION_ORDER) {
    regions[region] = new THREE.MeshStandardMaterial({
      color: base.clone(),
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    });
  }

  const trim = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  return { regions, trim };
}

function disposeMaterials(materials: MaterialSet): void {
  for (const region of REGION_ORDER) {
    materials.regions[region].dispose();
  }
  materials.trim.dispose();
}

/**
 * Loads the garment for a product: a production GLB when available at the
 * product's modelPath, otherwise the procedural development geometry.
 * Shirt color and per-region print textures are applied to the real
 * materials and update in place (no geometry rebuild).
 */
export function useShirtModel(product: Product | null, input: ShirtModelInput) {
  const { shirtColor, regionTextures } = input;
  const [group, setGroup] = useState<THREE.Group | null>(null);
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [usesGLB, setUsesGLB] = useState(false);

  const groupRef = useRef<THREE.Group | null>(null);
  const regionMeshesRef = useRef<Partial<Record<RegionId, THREE.Mesh>>>({});
  const trimMeshesRef = useRef<THREE.Mesh[]>([]);
  const materialsRef = useRef<MaterialSet | null>(null);

  // Build the garment when the product changes.
  useEffect(() => {
    let cancelled = false;

    // Clear the current garment before rebuilding so the renderer never
    // draws a disposed geometry between rebuild steps.
    setGroup(null);

    // Dispose the previous garment + materials before rebuilding.
    if (groupRef.current) {
      disposeGroup(groupRef.current);
      groupRef.current = null;
    }
    if (materialsRef.current) {
      disposeMaterials(materialsRef.current);
      materialsRef.current = null;
    }
    regionMeshesRef.current = {};
    trimMeshesRef.current = [];

    if (!product) {
      setGroup(null);
      setStatus("idle");
      return;
    }

    setStatus("loading");

    void (async () => {
      try {
        let builtGroup: THREE.Group;
        let regionMeshes: Partial<Record<RegionId, THREE.Mesh>>;
        let trimMeshes: THREE.Mesh[] = [];
        let isGLB = false;

        if (product.modelPath && (await modelExists(product.modelPath))) {
          const glb = await loadGLB(product.modelPath);
          isGLB = true;
          const materials = createMaterials(shirtColor);
          regionMeshes = applyRegionMaterials(glb, materials);
          builtGroup = glb;
          materialsRef.current = materials;
          trimMeshes = [];
          builtGroup.traverse((child) => {
            if (
              child instanceof THREE.Mesh &&
              !Object.values(regionMeshes).includes(child)
            ) {
              trimMeshes.push(child);
            }
          });
        } else {
          const built = buildGarment(garmentParamsForProduct(product.id));
          builtGroup = built.group;
          regionMeshes = built.regionMeshes;
          trimMeshes = built.trimMeshes;
          const materials = createMaterials(shirtColor);
          for (const region of REGION_ORDER) {
            const mesh = regionMeshes[region];
            if (mesh) mesh.material = materials.regions[region];
          }
          for (const trim of trimMeshes) {
            trim.material = materials.trim;
          }
          materialsRef.current = materials;
        }

        if (cancelled) {
          disposeGroup(builtGroup);
          if (materialsRef.current) disposeMaterials(materialsRef.current);
          return;
        }

        groupRef.current = builtGroup;
        regionMeshesRef.current = regionMeshes;
        trimMeshesRef.current = trimMeshes;
        setGroup(builtGroup);
        setUsesGLB(isGLB);
        setStatus("ready");
      } catch (error) {
        console.error("[threadlab] failed to load garment model", error);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Recreate materials when the shirt color changes (geometry is untouched).
  useEffect(() => {
    const previous = materialsRef.current;
    const materials = createMaterials(shirtColor);
    materialsRef.current = materials;

    for (const region of REGION_ORDER) {
      const mesh = regionMeshesRef.current[region];
      if (mesh) mesh.material = materials.regions[region];
    }
    for (const mesh of trimMeshesRef.current) {
      mesh.material = materials.trim;
    }

    if (previous) disposeMaterials(previous);
  }, [shirtColor]);

  // Apply region print textures to the live materials.
  useEffect(() => {
    const materials = materialsRef.current;
    if (!materials) return;
    const base = new THREE.Color(shirtColor);
    for (const region of REGION_ORDER) {
      const material = materials.regions[region];
      material.color.copy(base);
      const texture = regionTextures[region] ?? null;
      if (material.map !== texture) {
        material.map = texture;
        material.needsUpdate = true;
      }
    }
  }, [shirtColor, regionTextures]);

  // Full cleanup on unmount.
  useEffect(() => {
    return () => {
      if (groupRef.current) {
        disposeGroup(groupRef.current);
        groupRef.current = null;
      }
      if (materialsRef.current) {
        disposeMaterials(materialsRef.current);
        materialsRef.current = null;
      }
    };
  }, []);

  return { group, status, usesGLB };
}
