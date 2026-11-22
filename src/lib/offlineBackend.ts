import type { Backend, NewDesignInput, StoreAssetInput, UpdateDesignInput } from "@/lib/backend";
import { SHIRT_COLOR_PRESETS } from "@/lib/constants";
import type {
  CartItem,
  DesignAsset,
  DesignRecord,
  OrderRecord,
  Product,
} from "@/types";

/**
 * Local offline persistence layer.
 *
 * Implements the exact same `Backend` interface as the Convex backend so the
 * application code is identical in both modes. Data is stored in
 * localStorage; uploaded artwork assets are kept as data URLs. This is a
 * development fallback for when no Convex deployment is configured — it is
 * NOT a substitute for the Convex backend, which owns persistence in any
 * deployed environment.
 */

const PREFIX = "threadlab:offline:";
const SEED_KEY = `${PREFIX}seeded`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Quota exceeded — surface a clear signal to the caller.
    console.warn("[threadlab:offline] localStorage write failed (quota exceeded)", error);
    throw new Error(
      "Local offline storage is full. Configure a Convex deployment (CONVEX_URL) for persistent storage.",
    );
  }
}

function now(): number {
  return Date.now();
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/** Seed the apparel catalog once, mirroring the Convex products table. */
function seedProducts(): Product[] {
  const base: Array<Omit<Product, "id" | "sortOrder"> & { key: string }> = [
    {
      key: "classic-tee",
      name: "Classic T-Shirt",
      description:
        "The everyday essential. A regular-fit cotton tee with a clean crew neckline — the perfect canvas for any design.",
      category: "Classic T-Shirt",
      priceCents: 2400,
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      colors: SHIRT_COLOR_PRESETS.map((c) => ({ ...c })),
      modelPath: null,
      thumbnail: null,
      active: true,
    },
    {
      key: "oversized-tee",
      name: "Oversized T-Shirt",
      description:
        "A relaxed, dropped-shoulder silhouette with extra room through the body for an effortless oversized look.",
      category: "Oversized T-Shirt",
      priceCents: 2900,
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      colors: SHIRT_COLOR_PRESETS.map((c) => ({ ...c })),
      modelPath: null,
      thumbnail: null,
      active: true,
    },
    {
      key: "polo-shirt",
      name: "Polo Shirt",
      description:
        "A refined knit polo with a two-button placket and collar — smart-casual tailoring made to carry your branding.",
      category: "Polo Shirt",
      priceCents: 3400,
      sizes: ["S", "M", "L", "XL", "2XL"],
      colors: SHIRT_COLOR_PRESETS.map((c) => ({ ...c })),
      modelPath: null,
      thumbnail: null,
      active: true,
    },
    {
      key: "long-sleeve",
      name: "Long Sleeve",
      description:
        "A long-sleeve crew tee with extended cuffs — ideal for layered looks and larger print areas on the arms.",
      category: "Long Sleeve",
      priceCents: 2800,
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      colors: SHIRT_COLOR_PRESETS.map((c) => ({ ...c })),
      modelPath: null,
      thumbnail: null,
      active: true,
    },
    {
      key: "hoodie",
      name: "Hoodie",
      description:
        "A heavyweight fleece hoodie with a roomy front pocket and adjustable drawcord hood for premium comfort.",
      category: "Hoodie",
      priceCents: 4900,
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      colors: SHIRT_COLOR_PRESETS.map((c) => ({ ...c })),
      modelPath: null,
      thumbnail: null,
      active: true,
    },
    {
      key: "sweatshirt",
      name: "Sweatshirt",
      description:
        "A classic crewneck sweatshirt in soft brushed fleece — a clean, unlined canvas for bold graphics.",
      category: "Sweatshirt",
      priceCents: 4200,
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      colors: SHIRT_COLOR_PRESETS.map((c) => ({ ...c })),
      modelPath: null,
      thumbnail: null,
      active: true,
    },
    {
      key: "tank-top",
      name: "Tank Top",
      description:
        "A slim-fit tank with a deep scoop neckline and open armholes — lightweight and perfect for summer prints.",
      category: "Tank Top",
      priceCents: 2200,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: SHIRT_COLOR_PRESETS.map((c) => ({ ...c })),
      modelPath: null,
      thumbnail: null,
      active: true,
    },
  ];

  return base.map((product, index) => {
    const { key, ...rest } = product;
    void key;
    return { ...rest, id: rest.category.toLowerCase().replace(/\s+/g, "-"), sortOrder: index };
  });
}

function ensureSeeded(): void {
  if (!window.localStorage.getItem(SEED_KEY)) {
    write(`${PREFIX}products`, seedProducts());
    window.localStorage.setItem(SEED_KEY, "1");
  }
}

function listProducts(): Product[] {
  ensureSeeded();
  return read<Product[]>(`${PREFIX}products`, []);
}

function listDesigns(userId: string): DesignRecord[] {
  return read<DesignRecord[]>(`${PREFIX}designs`, [])
    .filter((design) => design.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function saveDesigns(all: DesignRecord[]): void {
  write(`${PREFIX}designs`, all);
}

function listAssets(userId: string): DesignAsset[] {
  return read<DesignAsset[]>(`${PREFIX}assets`, []).filter((asset) => asset.userId === userId);
}

function saveAssets(all: DesignAsset[]): void {
  write(`${PREFIX}assets`, all);
}

function listCart(userId: string): CartItem[] {
  return read<CartItem[]>(`${PREFIX}cart`, []).filter((item) => item.userId === userId);
}

function saveCart(all: CartItem[]): void {
  write(`${PREFIX}cart`, all);
}

function listOrders(userId: string): OrderRecord[] {
  return read<OrderRecord[]>(`${PREFIX}orders`, [])
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function saveOrders(all: OrderRecord[]): void {
  write(`${PREFIX}orders`, all);
}

export function createOfflineBackend(): Backend {
  return {
    mode: "offline",

    products: {
      list: async () => listProducts(),
      get: async (id) => listProducts().find((product) => product.id === id) ?? null,
    },

    designs: {
      list: async (userId) => listDesigns(userId),
      get: async (id) =>
        read<DesignRecord[]>(`${PREFIX}designs`, []).find((design) => design.id === id) ?? null,
      create: async (input: NewDesignInput): Promise<DesignRecord> => {
        const record: DesignRecord = {
          id: uid("design"),
          userId: input.userId,
          name: input.name,
          productId: input.productId,
          productType: input.productType,
          shirtColor: input.shirtColor,
          config: input.config,
          assetIds: input.assetIds,
          previewFrontId: null,
          previewBackId: null,
          createdAt: now(),
          updatedAt: now(),
        };
        const all = read<DesignRecord[]>(`${PREFIX}designs`, []);
        all.push(record);
        saveDesigns(all);
        return record;
      },
      update: async (id: string, patch: UpdateDesignInput): Promise<DesignRecord> => {
        const all = read<DesignRecord[]>(`${PREFIX}designs`, []);
        const index = all.findIndex((design) => design.id === id);
        if (index === -1) throw new Error("Design not found");
        all[index] = { ...all[index], ...patch, updatedAt: now() };
        saveDesigns(all);
        return all[index];
      },
      remove: async (id: string): Promise<void> => {
        const all = read<DesignRecord[]>(`${PREFIX}designs`, []).filter(
          (design) => design.id !== id,
        );
        saveDesigns(all);
      },
      duplicate: async (id: string, userId: string): Promise<DesignRecord> => {
        const source = read<DesignRecord[]>(`${PREFIX}designs`, []).find((d) => d.id === id);
        if (!source) throw new Error("Design not found");
        const copy: DesignRecord = {
          ...source,
          id: uid("design"),
          userId,
          name: `${source.name} (Copy)`,
          createdAt: now(),
          updatedAt: now(),
        };
        const all = read<DesignRecord[]>(`${PREFIX}designs`, []);
        all.push(copy);
        saveDesigns(all);
        return copy;
      },
    },

    designAssets: {
      list: async (userId) => listAssets(userId),
      getUrl: async (id: string): Promise<string | null> =>
        read<DesignAsset[]>(`${PREFIX}assets`, []).find((asset) => asset.id === id)?.dataUrl ?? null,
      store: async (input: StoreAssetInput): Promise<DesignAsset> => {
        const asset: DesignAsset = {
          id: uid("asset"),
          userId: input.userId,
          name: input.name,
          contentType: input.contentType,
          size: input.dataUrl.length,
          dataUrl: input.dataUrl,
          storageId: null,
          createdAt: now(),
        };
        void input.kind;
        const all = read<DesignAsset[]>(`${PREFIX}assets`, []);
        all.push(asset);
        saveAssets(all);
        return asset;
      },
      remove: async (id: string): Promise<void> => {
        const all = read<DesignAsset[]>(`${PREFIX}assets`, []).filter((asset) => asset.id !== id);
        saveAssets(all);
      },
    },

    cart: {
      list: async (userId) => listCart(userId),
      add: async (input) => {
        const item: CartItem = {
          id: uid("cart"),
          ...input,
          userId: input.userId,
          createdAt: now(),
        };
        const all = read<CartItem[]>(`${PREFIX}cart`, []);
        all.push(item);
        saveCart(all);
        return item;
      },
      setQuantity: async (id: string, quantity: number): Promise<void> => {
        const all = read<CartItem[]>(`${PREFIX}cart`, []);
        const index = all.findIndex((item) => item.id === id);
        if (index !== -1) {
          all[index] = { ...all[index], quantity };
          saveCart(all);
        }
      },
      remove: async (id: string): Promise<void> => {
        const all = read<CartItem[]>(`${PREFIX}cart`, []).filter((item) => item.id !== id);
        saveCart(all);
      },
      clear: async (userId: string): Promise<void> => {
        saveCart(read<CartItem[]>(`${PREFIX}cart`, []).filter((item) => item.userId !== userId));
      },
    },

    orders: {
      list: async (userId) => listOrders(userId),
      create: async (input) => {
        const order: OrderRecord = {
          id: uid("order"),
          userId: input.userId,
          status: "simulated",
          items: input.items,
          totalCents: input.totalCents,
          createdAt: now(),
        };
        const all = read<OrderRecord[]>(`${PREFIX}orders`, []);
        all.push(order);
        saveOrders(all);
        return order;
      },
    },
  };
}
