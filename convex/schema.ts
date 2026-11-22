import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { designElementValidator, orderItemValidator, textStyleValidator } from "./lib/validators";

/**
 * THREADLAB database schema — Convex is the only backend and database.
 *
 * Tables:
 *  - users        auth-ready user profiles
 *  - products     apparel catalog
 *  - designs      saved customization configurations
 *  - designAssets uploaded artwork + generated preview images (Convex storage)
 *  - cartItems    user cart
 *  - orders       simulated order records
 */
export const schema = defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_email", ["email"]),

  products: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    priceCents: v.number(),
    sizes: v.array(v.string()),
    colors: v.array(v.object({ name: v.string(), hex: v.string() })),
    modelPath: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    active: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_sort_order", ["sortOrder"])
    .index("by_active", ["active"]),

  designs: defineTable({
    userId: v.string(),
    name: v.string(),
    productId: v.string(),
    productType: v.string(),
    shirtColor: v.string(),
    config: v.object({
      shirtColor: v.string(),
      elements: v.array(designElementValidator),
    }),
    assetIds: v.array(v.string()),
    previewFrontId: v.optional(v.string()),
    previewBackId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  designAssets: defineTable({
    userId: v.string(),
    name: v.string(),
    kind: v.union(v.literal("artwork"), v.literal("preview")),
    contentType: v.string(),
    size: v.number(),
    storageId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_kind", ["kind"]),

  cartItems: defineTable({
    userId: v.string(),
    productId: v.string(),
    productName: v.string(),
    designId: v.optional(v.string()),
    designName: v.optional(v.string()),
    designPreview: v.optional(v.string()),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

  orders: defineTable({
    userId: v.string(),
    status: v.union(
      v.literal("simulated"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
    ),
    items: v.array(orderItemValidator),
    totalCents: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),
});

export type DesignElement = {
  id: string;
  name: string;
  kind: "artwork" | "text" | "graphic";
  region: "front" | "back" | "leftSleeve" | "rightSleeve";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  assetId?: string;
  text?: {
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
  };
  graphicId?: string;
};

export type TextStyle = {
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
};

