import { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Casts a Convex client call result to its expected type. The stand-in API
 * reference types every query as returning `unknown`; the Convex client
 * enforces this at runtime regardless.
 */
function typed<T>(promise: Promise<unknown>): Promise<T> {
  return promise as Promise<T>;
}
import { createOfflineBackend } from "@/lib/offlineBackend";
import type {
  CartItem,
  DesignAsset,
  DesignRecord,
  OrderRecord,
  Product,
} from "@/types";

/** Input shapes for mutations — mirror the Convex validators exactly. */
export interface NewDesignInput {
  userId: string;
  name: string;
  productId: string;
  productType: Product["category"];
  shirtColor: string;
  config: DesignRecord["config"];
  assetIds: string[];
}

export interface UpdateDesignInput {
  name?: string;
  shirtColor?: string;
  config?: DesignRecord["config"];
  assetIds?: string[];
  previewFrontId?: string | null;
  previewBackId?: string | null;
}

export interface StoreAssetInput {
  userId: string;
  name: string;
  contentType: string;
  dataUrl: string;
  kind: "artwork" | "preview";
}

/** Converts a data URL into a Blob for the Convex upload-URL flow. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(",");
  const metadata = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const mime = /data:([^;]+)/.exec(metadata)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export interface AddCartItemInput {
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
}

export interface CreateOrderInput {
  userId: string;
  items: OrderRecord["items"];
  totalCents: number;
}

/**
 * The single persistence surface for the app.
 *
 * Every persistent operation goes through this interface. The real
 * implementation is Convex (`createConvexBackend`). When no Convex deployment
 * is configured, the app runs against a local offline implementation
 * (`createOfflineBackend`) so the studio remains fully usable — data persists
 * in the browser only and a warning banner is shown. Components never touch
 * storage or the database directly.
 */
export interface Backend {
  readonly mode: "convex" | "offline";
  products: {
    list(): Promise<Product[]>;
    get(id: string): Promise<Product | null>;
  };
  designs: {
    list(userId: string): Promise<DesignRecord[]>;
    get(id: string): Promise<DesignRecord | null>;
    create(input: NewDesignInput): Promise<DesignRecord>;
    update(id: string, patch: UpdateDesignInput): Promise<DesignRecord>;
    remove(id: string): Promise<void>;
    duplicate(id: string, userId: string): Promise<DesignRecord>;
  };
  designAssets: {
    list(userId: string): Promise<DesignAsset[]>;
    store(input: StoreAssetInput): Promise<DesignAsset>;
    /** URL (storage URL or data URL) for loading the asset's image. */
    getUrl(id: string): Promise<string | null>;
    remove(id: string): Promise<void>;
  };
  cart: {
    list(userId: string): Promise<CartItem[]>;
    add(input: AddCartItemInput): Promise<CartItem>;
    setQuantity(id: string, quantity: number): Promise<void>;
    remove(id: string): Promise<void>;
    clear(userId: string): Promise<void>;
  };
  orders: {
    list(userId: string): Promise<OrderRecord[]>;
    create(input: CreateOrderInput): Promise<OrderRecord>;
  };
}

export function isConvexConfigured(): boolean {
  return Boolean(import.meta.env.VITE_CONVEX_URL || import.meta.env.CONVEX_URL);
}

let cachedBackend: Backend | null = null;

export function getBackend(): Backend {
  if (!cachedBackend) {
    cachedBackend = isConvexConfigured() ? createConvexBackend() : createOfflineBackend();
  }
  return cachedBackend;
}

/** Reset the cached backend (dev helper after env configuration changes). */
export function resetBackend(): void {
  cachedBackend = null;
}

function createConvexBackend(): Backend {
  const url = import.meta.env.VITE_CONVEX_URL || import.meta.env.CONVEX_URL!;
  const client = new ConvexReactClient(url);

  return {
    mode: "convex",
    products: {
      list: () => typed<Product[]>(client.query(api.products.list, {})),
      get: (id) => typed<Product | null>(client.query(api.products.get, { id })),
    },
    designs: {
      list: (userId) => typed<DesignRecord[]>(client.query(api.designs.list, { userId })),
      get: (id) => typed<DesignRecord | null>(client.query(api.designs.get, { id })),
      create: (input) => typed<DesignRecord>(client.mutation(api.designs.create, { ...input })),
      update: (id, patch) =>
        typed<DesignRecord>(client.mutation(api.designs.update, { id, patch: { ...patch } })),
      remove: (id) => typed<void>(client.mutation(api.designs.remove, { id })),
      duplicate: (id) => typed<DesignRecord>(client.mutation(api.designs.duplicate, { id })),
    },
    designAssets: {
      list: (userId) => typed<DesignAsset[]>(client.query(api.designAssets.list, { userId })),
      store: async (input) => {
        const uploadUrl = await typed<string>(
          client.mutation(api.designAssets.createUploadUrl, {
            kind: input.kind,
          }),
        );
        const blob = dataUrlToBlob(input.dataUrl);
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: blob,
          headers: { "Content-Type": input.contentType },
        });
        if (!response.ok) throw new Error(`Asset upload failed (${response.status})`);
        const { storageId } = (await response.json()) as { storageId: string };
        return typed<DesignAsset>(
          client.mutation(api.designAssets.register, {
            name: input.name,
            kind: input.kind,
            contentType: input.contentType,
            storageId: storageId as never,
            size: blob.size,
          }),
        );
      },
      getUrl: (id) => typed<string | null>(client.query(api.designAssets.url, { id })),
      remove: (id) => typed<void>(client.mutation(api.designAssets.remove, { id })),
    },
    cart: {
      list: (userId) => typed<CartItem[]>(client.query(api.cart.list, { userId })),
      add: (input) =>
        typed<CartItem>(client.mutation(api.cart.add, {
          productId: input.productId,
          productName: input.productName,
          designId: input.designId,
          designName: input.designName,
          designPreview: input.designPreview,
          size: input.size,
          color: input.color,
          quantity: input.quantity,
          unitPriceCents: input.unitPriceCents,
        })),
      setQuantity: (id, quantity) =>
        typed<void>(client.mutation(api.cart.setQuantity, { id, quantity })),
      remove: (id) => typed<void>(client.mutation(api.cart.remove, { id })),
      clear: () => typed<void>(client.mutation(api.cart.clear, {})),
    },
    orders: {
      list: (userId) => typed<OrderRecord[]>(client.query(api.orders.list, { userId })),
      create: (input) => typed<OrderRecord>(client.mutation(api.orders.create, { ...input })),
    },
  };
}
