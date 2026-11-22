import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUserId } from "./lib/identity";
import { asId } from "./lib/ids";

/**
 * Design assets — uploaded artwork and generated preview images.
 *
 * Binary payloads live in Convex storage via the upload-URL flow: a mutation
 * mints a short-lived upload URL, the client POSTs the file to it, and a
 * second mutation registers the asset metadata row. This avoids pushing
 * base64 blobs through function arguments. Designs reference assets by id,
 * keeping the design configuration small and separate from binary data.
 */

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("designAssets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/** Public storage URL for an asset's binary payload. */
export const url = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(asId<"designAssets">(args.id));
    if (!asset?.storageId) return null;
    return ctx.storage.getUrl(asId<"_storage">(asset.storageId));
  },
});

/** Mints a short-lived upload URL for storing a file in Convex storage. */
export const createUploadUrl = mutation({
  args: { kind: v.union(v.literal("artwork"), v.literal("preview")) },
  handler: async (ctx, args) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Registers an asset metadata row after the client uploads the file. */
export const register = mutation({
  args: {
    name: v.string(),
    kind: v.union(v.literal("artwork"), v.literal("preview")),
    contentType: v.string(),
    storageId: v.id("_storage"),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("designAssets", {
      userId,
      name: args.name,
      kind: args.kind,
      contentType: args.contentType,
      size: args.size,
      storageId: args.storageId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const asset = await ctx.db.get(asId<"designAssets">(args.id));
    if (!asset) return;
    if (asset.userId !== userId) throw new Error("Asset not found");
    if (asset.storageId) {
      await ctx.storage.delete(asId<"_storage">(asset.storageId));
    }
    await ctx.db.delete(asId<"designAssets">(args.id));
  },
});
