import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { orderItemValidator } from "./lib/validators";
import { requireUserId } from "./lib/identity";
import { asId } from "./lib/ids";

/**
 * User cart. Ownership is derived from the Convex auth identity — the
 * client-supplied userId (present in the offline input shape) is ignored for
 * ownership decisions in deployed environments.
 */
export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const add = mutation({
  args: {
    productId: v.string(),
    productName: v.string(),
    designId: v.union(v.string(), v.null()),
    designName: v.union(v.string(), v.null()),
    designPreview: v.union(v.string(), v.null()),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("cartItems", {
      userId,
      productId: args.productId,
      productName: args.productName,
      designId: args.designId ?? undefined,
      designName: args.designName ?? undefined,
      designPreview: args.designPreview ?? undefined,
      size: args.size,
      color: args.color,
      quantity: args.quantity,
      unitPriceCents: args.unitPriceCents,
      createdAt: Date.now(),
    });
  },
});

export const setQuantity = mutation({
  args: { id: v.string(), quantity: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const item = await ctx.db.get(asId<"cartItems">(args.id));
    if (!item) throw new Error("Cart item not found");
    if (item.userId !== userId) throw new Error("Cart item not found");
    await ctx.db.patch(asId<"cartItems">(args.id), { quantity: args.quantity });
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const item = await ctx.db.get(asId<"cartItems">(args.id));
    if (!item) return;
    if (item.userId !== userId) throw new Error("Cart item not found");
    await ctx.db.delete(asId<"cartItems">(args.id));
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});
