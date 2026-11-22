import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Model loading service.
 *
 * Production GLB support: place a GLB at /models/<product-slug>.glb and the
 * studio loads it automatically in place of the procedural development
 * geometry. Region convention for printable materials:
 *
 *   bodyFront / front        → front region
 *   bodyBack  / back         → back region
 *   sleeveLeft               → left sleeve region
 *   sleeveRight              → right sleeve region
 *
 * Any other mesh is rendered as garment trim. If a GLB contains no
 * recognizable region names, its meshes are treated as a single front
 * printable region (with a console warning).
 */

export async function modelExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

let loader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!loader) {
    loader = new GLTFLoader();
  }
  return loader;
}

export async function loadGLB(path: string): Promise<THREE.Group> {
  const gltf = await getLoader().loadAsync(path);
  const group = gltf.scene;
  group.name = "garment";
  return group;
}

/** Maps region names (mesh or material) to region ids. */
const REGION_NAME_MAP: Record<string, string> = {
  front: "front",
  bodyfront: "front",
  body: "front",
  back: "back",
  bodyback: "back",
  leftsleeve: "leftSleeve",
  sleeveleft: "leftSleeve",
  rightsleeve: "rightSleeve",
  sleeveright: "rightSleeve",
};

function regionIdForName(name: string): string | null {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  return REGION_NAME_MAP[normalized] ?? null;
}

/**
 * Assigns region materials to a loaded GLB group.
 * Returns the region meshes found (possibly empty).
 */
export function applyRegionMaterials(
  group: THREE.Group,
  materials: {
    regions: Record<string, THREE.MeshStandardMaterial>;
    trim: THREE.MeshStandardMaterial;
  },
): Record<string, THREE.Mesh> {
  const regionMeshes: Record<string, THREE.Mesh> = {};
  let assigned = 0;

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const nameRegion = regionIdForName(child.name) ?? regionIdForName(child.material.name ?? "");
    if (nameRegion && materials.regions[nameRegion]) {
      child.material = materials.regions[nameRegion];
      regionMeshes[nameRegion] = child;
      assigned += 1;
    } else {
      child.material = materials.trim.clone();
    }
  });

  if (assigned === 0) {
    console.warn(
      "[threadlab] GLB contains no region-named meshes (expected bodyFront, bodyBack, sleeveLeft, sleeveRight). Falling back to treating all meshes as the front printable region.",
    );
    let firstMesh: THREE.Mesh | null = null;
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = materials.regions.front;
        if (!firstMesh) firstMesh = child;
      }
    });
    if (firstMesh) regionMeshes.front = firstMesh;
  }

  return regionMeshes;
}

/** Recursively disposes geometries and materials of a group. */
export function disposeGroup(group: THREE.Object3D): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        // Materials in the group are always created by the renderer; textures
        // they reference are owned and disposed by the React layer.
        if (material instanceof THREE.Material) {
          material.dispose();
        }
      }
    }
  });
}
