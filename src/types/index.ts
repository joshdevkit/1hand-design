import type { ApparelCategory } from "@/lib/constants";

/** A single printable region on a garment (maps to a UV area + material). */
export type RegionId = "front" | "back" | "leftSleeve" | "rightSleeve";

export type DesignElementKind = "artwork" | "text" | "graphic";

export interface TextStyle {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  color: string;
  align: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;
  backgroundColor: string | null;
}

export interface DesignElement {
  id: string;
  name: string;
  kind: DesignElementKind;
  /** Which garment surface this element is printed on. */
  region: RegionId;
  /** Center position in region-normalized design space (0..1). */
  x: number;
  y: number;
  /** Size in region-normalized design space (fraction of printable area). */
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  /** Layer stacking order (higher = drawn on top). */
  zIndex: number;
  /** Reference to a stored artwork asset (persisted form). */
  assetId?: string;
  /** In-memory artwork source (resolved from an asset at load time). */
  imageData?: string;
  /** Text content for text elements. */
  text?: TextStyle;
  /** Built-in graphic id for graphic elements. */
  graphicId?: string;
}

/** Full customization configuration stored per design. */
export interface DesignConfig {
  shirtColor: string;
  elements: DesignElement[];
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ApparelCategory;
  priceCents: number;
  sizes: string[];
  colors: ProductColorOption[];
  /** Path to the 3D model asset (GLB) under /models, or null for procedural geometry. */
  modelPath: string | null;
  thumbnail: string | null;
  active: boolean;
  sortOrder: number;
}

export interface DesignRecord {
  id: string;
  userId: string;
  name: string;
  productId: string;
  productType: ApparelCategory;
  shirtColor: string;
  config: DesignConfig;
  /** References to stored artwork assets. */
  assetIds: string[];
  /** References to generated preview image assets. */
  previewFrontId: string | null;
  previewBackId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface DesignAsset {
  id: string;
  userId: string;
  name: string;
  contentType: string;
  size: number;
  /** Data URL for offline-mode assets, or a Convex storage reference. */
  dataUrl: string | null;
  storageId: string | null;
  createdAt: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  designId: string | null;
  designName: string | null;
  designPreview: string | null;
  size: string;
  color: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: number;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  designId: string | null;
  designName: string | null;
  size: string;
  color: string;
  quantity: number;
  unitPriceCents: number;
}

export interface OrderRecord {
  id: string;
  userId: string;
  status: "simulated" | "processing" | "shipped" | "delivered";
  items: OrderItemSnapshot[];
  totalCents: number;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  createdAt: number;
}
