import * as THREE from "three";
import type { GarmentParams } from "@/features/three-d/types/three-d.types";
import type { RegionId } from "@/types";

/**
 * Procedural garment geometry.
 *
 * Builds a real, UV-unwrapped apparel mesh from parametric surfaces:
 *  - front & back body panels (each with full [0,1]² UVs for print mapping)
 *  - side-seam ribbons closing the torso
 *  - tapered sleeves with UV-mapped outer print band
 *  - collar tube, hem band, hood, pocket, placket, buttons (trim)
 *
 * This is the development model used while no production GLB is available.
 * The mesh topology, UV layout, and named region meshes match the material
 * region convention documented in the GLB loader, so dropping a production
 * GLB into /models replaces this geometry without touching the renderer.
 */

const PANEL_SEGMENTS_U = 48;
const PANEL_SEGMENTS_V = 40;
const SLEEVE_SEGMENTS_A = 28;
const SLEEVE_SEGMENTS_T = 20;

/** Half-width profile of the body by height fraction (hem → shoulder). */
const WIDTH_KEYS: Array<[number, number]> = [
  [0.0, 0.84],
  [0.28, 0.94],
  [0.62, 0.9],
  [1.0, 0.76],
];

function widthAt(t: number): number {
  for (let i = 0; i < WIDTH_KEYS.length - 1; i += 1) {
    const [t0, w0] = WIDTH_KEYS[i];
    const [t1, w1] = WIDTH_KEYS[i + 1];
    if (t <= t1) {
      const f = THREE.MathUtils.smoothstep(t, t0, t1);
      return w0 + (w1 - w0) * f;
    }
  }
  return WIDTH_KEYS[WIDTH_KEYS.length - 1][1];
}

function neckCurve(s: number, neck: GarmentParams["neck"]): number {
  if (neck === "v") {
    return 1 - Math.abs(2 * s - 1);
  }
  return Math.pow(1 - Math.pow(2 * s - 1, 2), 0.8);
}

interface BuiltPanel {
  geometry: THREE.BufferGeometry;
  topEdge: THREE.Vector3[];
  sideEdges: { left: THREE.Vector3[]; right: THREE.Vector3[] };
}

function buildBodyPanel(params: GarmentParams, isFront: boolean): BuiltPanel {
  const zSign = isFront ? 1 : -1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const topEdge: THREE.Vector3[] = [];
  const leftEdge: THREE.Vector3[] = [];
  const rightEdge: THREE.Vector3[] = [];

  const point = (s: number, t: number): THREE.Vector3 => {
    const width = widthAt(t) * params.widthScale;
    const x = (s - 0.5) * width;
    const dipFactor = THREE.MathUtils.clamp((t - 0.84) / 0.16, 0, 1);
    const smoothDip = THREE.MathUtils.smoothstep(dipFactor, 0, 1);
    const y = t * params.height - params.neckDip * neckCurve(s, params.neck) * smoothDip;
    const bulge = 0.055 * Math.sin(Math.PI * s) * (0.3 + 0.7 * t);
    const z = zSign * (0.022 + bulge);
    return new THREE.Vector3(x, y, z);
  };

  for (let vi = 0; vi <= PANEL_SEGMENTS_V; vi += 1) {
    const t = vi / PANEL_SEGMENTS_V;
    for (let ui = 0; ui <= PANEL_SEGMENTS_U; ui += 1) {
      const s = ui / PANEL_SEGMENTS_U;
      const p = point(s, t);
      positions.push(p.x, p.y, p.z);
      uvs.push(s, t);
    }
  }

  const rowSize = PANEL_SEGMENTS_U + 1;
  for (let vi = 0; vi < PANEL_SEGMENTS_V; vi += 1) {
    for (let ui = 0; ui < PANEL_SEGMENTS_U; ui += 1) {
      const a = vi * rowSize + ui;
      const b = a + 1;
      const c = a + rowSize;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  // Capture edge loops for collar / side seams.
  for (let vi = 0; vi <= PANEL_SEGMENTS_V; vi += 1) {
    const t = vi / PANEL_SEGMENTS_V;
    const sLeft = 0;
    const sRight = 1;
    leftEdge.push(point(sLeft, t));
    rightEdge.push(point(sRight, t));
  }
  for (let ui = 0; ui <= PANEL_SEGMENTS_U; ui += 1) {
    const s = ui / PANEL_SEGMENTS_U;
    topEdge.push(point(s, 1));
  }

  return { geometry, topEdge, sideEdges: { left: leftEdge, right: rightEdge } };
}

/** Ribbon closing the torso along one side seam. */
function buildSideSeam(frontEdge: THREE.Vector3[], backEdge: THREE.Vector3[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const count = frontEdge.length;

  for (let i = 0; i < count; i += 1) {
    const f = frontEdge[i];
    const b = backEdge[i];
    positions.push(f.x, f.y, f.z, b.x, b.y, b.z);
    uvs.push(0, i / (count - 1), 1, i / (count - 1));
  }
  for (let i = 0; i < count - 1; i += 1) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

interface SleeveBuild {
  geometry: THREE.BufferGeometry;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  dir: THREE.Vector3;
  length: number;
}

/** Tapered sleeve cylinder with a UV print band centered on the outer-front surface. */
function buildSleeve(side: 1 | -1, params: GarmentParams): SleeveBuild {
  const dir = new THREE.Vector3(side * 0.88, -0.34, 0.3).normalize();
  const position = new THREE.Vector3(
    side * 0.4 * params.widthScale,
    params.height - 0.05,
    0,
  );
  const length = params.sleeveLength * (params.relaxed ? 1.06 : 1);
  const r0 = 0.2 * params.sleeveRadius * params.widthScale;
  const r1 = r0 * 0.76;

  const up = new THREE.Vector3(0, 1, 0);
  const e1 = new THREE.Vector3().crossVectors(dir, up).normalize();
  const e2 = new THREE.Vector3().crossVectors(dir, e1).normalize();

  // Rotate the print band center (u=0.5 → physical angle π+φ) to face outward-forward.
  const outward = new THREE.Vector3(side * 0.62, -0.12, 0.5).normalize();
  const phi = Math.atan2(-outward.dot(e2), -outward.dot(e1));

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rowSize = SLEEVE_SEGMENTS_A + 1;

  const ringPoint = (a: number, t: number): THREE.Vector3 => {
    const radius = r0 + (r1 - r0) * t;
    const angle = a * Math.PI * 2 + phi;
    const offset = new THREE.Vector3(
      Math.cos(angle) * radius,
      t * length,
      Math.sin(angle) * radius,
    );
    return offset.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
    );
  };

  for (let ti = 0; ti <= SLEEVE_SEGMENTS_T; ti += 1) {
    const t = ti / SLEEVE_SEGMENTS_T;
    for (let ai = 0; ai <= SLEEVE_SEGMENTS_A; ai += 1) {
      const a = ai / SLEEVE_SEGMENTS_A;
      const p = ringPoint(a, t);
      positions.push(p.x, p.y, p.z);
      uvs.push(a, t);
    }
  }

  for (let ti = 0; ti < SLEEVE_SEGMENTS_T; ti += 1) {
    for (let ai = 0; ai < SLEEVE_SEGMENTS_A; ai += 1) {
      const a = ti * rowSize + ai;
      const b = a + 1;
      const c = a + rowSize;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir,
  );

  return { geometry, position, quaternion, dir, length };
}

/** Cuff ring at the end of a sleeve. */
function buildCuff(sleeve: SleeveBuild, params: GarmentParams): THREE.Mesh {
  const r0 = 0.2 * params.sleeveRadius * params.widthScale * 0.76;
  const cuffGeometry = new THREE.CylinderGeometry(r0 * 1.05, r0 * 1.05, 0.055, 24, 1, true);
  const mesh = new THREE.Mesh(cuffGeometry);
  mesh.position.copy(sleeve.position).addScaledVector(sleeve.dir, sleeve.length - 0.03);
  mesh.quaternion.copy(sleeve.quaternion);
  return mesh;
}

/** Tube along the closed neckline boundary. */
function buildCollar(
  params: GarmentParams,
  front: BuiltPanel,
  back: BuiltPanel,
): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  for (const p of front.topEdge) points.push(p.clone().setZ(p.z + 0.03));
  for (let i = back.topEdge.length - 1; i >= 0; i -= 1) {
    points.push(back.topEdge[i].clone().setZ(back.topEdge[i].z - 0.03));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.4);
  const geometry = new THREE.TubeGeometry(curve, 80, 0.058, 12, true);
  return new THREE.Mesh(geometry);
}

/** Tube along the closed hem boundary. */
function buildHemBand(params: GarmentParams): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  const count = 32;
  for (let i = 0; i <= count; i += 1) {
    const s = i / count;
    const width = widthAt(0) * params.widthScale;
    points.push(new THREE.Vector3((s - 0.5) * width, 0, 0.024));
  }
  for (let i = count; i >= 0; i -= 1) {
    const s = i / count;
    const width = widthAt(0) * params.widthScale;
    points.push(new THREE.Vector3((s - 0.5) * width, 0, -0.024));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.5);
  const geometry = new THREE.TubeGeometry(curve, 96, 0.048, 10, true);
  const mesh = new THREE.Mesh(geometry);
  mesh.position.y = 0.01;
  return mesh;
}

/** Hood: arc tube rising behind the neck. */
function buildHood(params: GarmentParams): THREE.Mesh {
  const center = new THREE.Vector3(0, params.height + 0.12, -0.06);
  const radius = 0.3;
  const points: THREE.Vector3[] = [];
  const segments = 28;
  for (let i = 0; i <= segments; i += 1) {
    const t = -0.6 * Math.PI + (1.2 * Math.PI * i) / segments;
    points.push(
      new THREE.Vector3(
        center.x + radius * 0.62 * Math.sin(t),
        center.y + radius * 0.95 * Math.cos(t) * 0.65 + radius * 0.42,
        center.z - radius * Math.cos(t) * 0.85,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
  const geometry = new THREE.TubeGeometry(curve, 48, 0.105, 14, false);
  return new THREE.Mesh(geometry);
}

function buildPocket(params: GarmentParams): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(
    0.5 * params.widthScale,
    0.42,
    0.03,
    4,
    4,
    1,
  );
  // Round the box edges slightly via vertex normals is overkill; keep crisp.
  const mesh = new THREE.Mesh(geometry);
  mesh.position.set(0, 0.55, 0.045);
  return mesh;
}

function buildPlacket(params: GarmentParams): { mesh: THREE.Mesh; buttons: THREE.Mesh[] } {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.028, 2, 4, 1));
  mesh.position.set(0, params.height - 0.22, 0.052);

  const buttons: THREE.Mesh[] = [];
  for (const y of [params.height - 0.34, params.height - 0.14]) {
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12));
    button.position.set(0, y, 0.068);
    buttons.push(button);
  }
  return { mesh, buttons };
}

export interface BuiltGarment {
  group: THREE.Group;
  regionMeshes: Record<RegionId, THREE.Mesh>;
  trimMeshes: THREE.Mesh[];
}

/** Builds the complete garment group for the given product params. */
export function buildGarment(params: GarmentParams): BuiltGarment {
  const group = new THREE.Group();
  group.name = "garment";

  const front = buildBodyPanel(params, true);
  const back = buildBodyPanel(params, false);

  const frontMesh = new THREE.Mesh(front.geometry);
  frontMesh.name = "region:front";
  const backMesh = new THREE.Mesh(back.geometry);
  backMesh.name = "region:back";
  group.add(frontMesh, backMesh);

  const seamLeft = buildSideSeam(front.sideEdges.left, back.sideEdges.left);
  const seamRight = buildSideSeam(front.sideEdges.right, back.sideEdges.right);
  group.add(new THREE.Mesh(seamLeft), new THREE.Mesh(seamRight));

  const trimMeshes: THREE.Mesh[] = [];
  const collar = buildCollar(params, front, back);
  collar.name = "trim:collar";
  trimMeshes.push(collar);
  group.add(collar);

  const hem = buildHemBand(params);
  hem.name = "trim:hem";
  trimMeshes.push(hem);
  group.add(hem);

  const regionMeshes = { front: frontMesh, back: backMesh } as Partial<
    Record<RegionId, THREE.Mesh>
  >;

  if (params.sleeveLength > 0) {
    for (const side of [1, -1] as const) {
      const sleeve = buildSleeve(side, params);
      const mesh = new THREE.Mesh(sleeve.geometry);
      mesh.name = side === 1 ? "region:rightSleeve" : "region:leftSleeve";
      mesh.position.copy(sleeve.position);
      mesh.quaternion.copy(sleeve.quaternion);
      group.add(mesh);
      regionMeshes[side === 1 ? "rightSleeve" : "leftSleeve"] = mesh;

      const cuff = buildCuff(sleeve, params);
      cuff.name = "trim:cuff";
      trimMeshes.push(cuff);
      group.add(cuff);
    }
  }

  if (params.hood) {
    const hood = buildHood(params);
    hood.name = "trim:hood";
    trimMeshes.push(hood);
    group.add(hood);
  }

  if (params.pocket) {
    const pocket = buildPocket(params);
    pocket.name = "trim:pocket";
    trimMeshes.push(pocket);
    group.add(pocket);
  }

  if (params.placket) {
    const placket = buildPlacket(params);
    placket.mesh.name = "trim:placket";
    trimMeshes.push(placket.mesh, ...placket.buttons);
    group.add(placket.mesh, ...placket.buttons);
  }

  // Center the garment vertically for a stable camera target.
  group.position.y = -params.height / 2 + 0.55;

  return { group, regionMeshes: regionMeshes as Record<RegionId, THREE.Mesh>, trimMeshes };
}
