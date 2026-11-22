import { v } from "convex/values";
import type { Infer } from "convex/values";
import { query, mutation } from "./_generated/server";
import { designConfigValidator, designElementValidator } from "./lib/validators";
import { requireUserId } from "./lib/identity";
import { asId } from "./lib/ids";

type DesignElementDoc = Infer<typeof designElementValidator>;

/**
 * Saved design configurations. All mutations enforce ownership — the acting
 * user is derived from the Convex auth identity, never from client input.
 */
export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("designs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(asId<"designs">(args.id));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    productId: v.string(),
    productType: v.string(),
    shirtColor: v.string(),
    config: designConfigValidator,
    assetIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("designs", {
      userId,
      name: args.name,
      productId: args.productId,
      productType: args.productType,
      shirtColor: args.shirtColor,
      config: { shirtColor: args.shirtColor, elements: args.config.elements },
      assetIds: args.assetIds,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    patch: v.object({
      name: v.optional(v.string()),
      shirtColor: v.optional(v.string()),
      config: v.optional(designConfigValidator),
      assetIds: v.optional(v.array(v.string())),
      previewFrontId: v.optional(v.union(v.string(), v.null())),
      previewBackId: v.optional(v.union(v.string(), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db.get(asId<"designs">(args.id));
    if (!existing) throw new Error("Design not found");
    if (existing.userId !== userId) throw new Error("Design not found");

    type DesignPatch = {
      name?: string;
      shirtColor?: string;
      config?: { shirtColor: string; elements: DesignElementDoc[] };
      assetIds?: string[];
      previewFrontId?: string;
      previewBackId?: string;
      updatedAt: number;
    };

    const patch: DesignPatch = { updatedAt: Date.now() };
    if (args.patch.name !== undefined) patch.name = args.patch.name;
    if (args.patch.shirtColor !== undefined) patch.shirtColor = args.patch.shirtColor;
    if (args.patch.config !== undefined) {
      patch.config = {
        shirtColor: args.patch.shirtColor ?? args.patch.config.shirtColor,
        elements: args.patch.config.elements,
      };
    }
    if (args.patch.assetIds !== undefined) patch.assetIds = args.patch.assetIds;
    if (args.patch.previewFrontId !== undefined) {
      patch.previewFrontId = args.patch.previewFrontId ?? undefined;
    }
    if (args.patch.previewBackId !== undefined) {
      patch.previewBackId = args.patch.previewBackId ?? undefined;
    }

    await ctx.db.patch(asId<"designs">(args.id), patch);
    return await ctx.db.get(asId<"designs">(args.id));
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db.get(asId<"designs">(args.id));
    if (!existing) return;
    if (existing.userId !== userId) throw new Error("Design not found");
    await ctx.db.delete(asId<"designs">(args.id));
  },
});

export const duplicate = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const source = await ctx.db.get(asId<"designs">(args.id));
    if (!source) throw new Error("Design not found");
    if (source.userId !== userId) throw new Error("Design not found");

    const now = Date.now();
    return await ctx.db.insert("designs", {
      userId,
      name: `${source.name} (Copy)`,
      productId: source.productId,
      productType: source.productType,
      shirtColor: source.shirtColor,
      config: source.config,
      assetIds: source.assetIds,
      createdAt: now,
      updatedAt: now,
    });
  },
});
