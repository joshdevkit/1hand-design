import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { orderItemValidator } from "./lib/validators";
import { requireUserId } from "./lib/identity";

/**
 * Simulated order records. Checkout is intentionally simulated — no payment
 * integration — but every order is persisted through Convex with a pricing
 * snapshot taken from the server-side product catalog.
 */
export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: { items: v.array(orderItemValidator), totalCents: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("orders", {
      userId,
      status: "simulated",
      items: args.items,
      totalCents: args.totalCents,
      createdAt: Date.now(),
    });
  },
});
