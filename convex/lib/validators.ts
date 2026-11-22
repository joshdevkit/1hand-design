import { v } from "convex/values";

/** Shared Convex validators — every backend input is validated here. */

export const regionValidator = v.union(
  v.literal("front"),
  v.literal("back"),
  v.literal("leftSleeve"),
  v.literal("rightSleeve"),
);

export const textStyleValidator = v.object({
  content: v.string(),
  fontFamily: v.string(),
  fontSize: v.number(),
  fontWeight: v.number(),
  italic: v.boolean(),
  color: v.string(),
  align: v.union(v.literal("left"), v.literal("center"), v.literal("right")),
  letterSpacing: v.number(),
  lineHeight: v.number(),
  backgroundColor: v.union(v.string(), v.null()),
});

export const designElementValidator = v.object({
  id: v.string(),
  name: v.string(),
  kind: v.union(v.literal("artwork"), v.literal("text"), v.literal("graphic")),
  region: regionValidator,
  x: v.number(),
  y: v.number(),
  width: v.number(),
  height: v.number(),
  rotation: v.number(),
  opacity: v.number(),
  locked: v.boolean(),
  visible: v.boolean(),
  zIndex: v.number(),
  assetId: v.optional(v.string()),
  text: v.optional(textStyleValidator),
  graphicId: v.optional(v.string()),
});

export const designConfigValidator = v.object({
  shirtColor: v.string(),
  elements: v.array(designElementValidator),
});

export const orderItemValidator = v.object({
  productId: v.string(),
  productName: v.string(),
  designId: v.union(v.string(), v.null()),
  designName: v.union(v.string(), v.null()),
  size: v.string(),
  color: v.string(),
  quantity: v.number(),
  unitPriceCents: v.number(),
});

export const productColorValidator = v.object({
  name: v.string(),
  hex: v.string(),
});
