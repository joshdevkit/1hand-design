import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { optionalUserId } from "./lib/identity";

/** User profile table — auth-ready; populated by the Convex Auth flow. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUserId(ctx);
    if (!userId) return null;
    // In a full auth deployment the identity subject maps to a users row;
    // here we return the subject so the client has a stable identity.
    return { id: userId };
  },
});

/** Creates a profile row for the acting user (idempotent by email). */
export const ensureProfile = mutation({
  args: { name: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (!userId) return null;

    if (args.email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      if (existing) return existing._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email ?? undefined,
      createdAt: Date.now(),
    });
  },
});
