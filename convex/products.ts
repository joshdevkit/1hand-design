import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Apparel catalog. Seed data mirrors the offline backend's catalog so both
 * persistence modes expose the same products.
 */
const SHIRT_COLORS = [
  { name: "White", hex: "#F4F4F5" },
  { name: "Black", hex: "#18181B" },
  { name: "Heather Grey", hex: "#9CA3AF" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Olive", hex: "#5C6B4A" },
  { name: "Sand", hex: "#D8C9A8" },
  { name: "Clay Red", hex: "#A6453B" },
  { name: "Deep Teal", hex: "#1F5F5B" },
  { name: "Ink Blue", hex: "#274690" },
  { name: "Forest", hex: "#2F5D3A" },
  { name: "Blush", hex: "#D9A7A0" },
  { name: "Charcoal", hex: "#3F3F46" },
];

const CATALOG: Array<{
  name: string;
  description: string;
  category: string;
  priceCents: number;
  sizes: string[];
}> = [
  {
    name: "Classic T-Shirt",
    description:
      "The everyday essential. A regular-fit cotton tee with a clean crew neckline — the perfect canvas for any design.",
    category: "Classic T-Shirt",
    priceCents: 2400,
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
  },
  {
    name: "Oversized T-Shirt",
    description:
      "A relaxed, dropped-shoulder silhouette with extra room through the body for an effortless oversized look.",
    category: "Oversized T-Shirt",
    priceCents: 2900,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    name: "Polo Shirt",
    description:
      "A refined knit polo with a two-button placket and collar — smart-casual tailoring made to carry your branding.",
    category: "Polo Shirt",
    priceCents: 3400,
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    name: "Long Sleeve",
    description:
      "A long-sleeve crew tee with extended cuffs — ideal for layered looks and larger print areas on the arms.",
    category: "Long Sleeve",
    priceCents: 2800,
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
  },
  {
    name: "Hoodie",
    description:
      "A heavyweight fleece hoodie with a roomy front pocket and adjustable drawcord hood for premium comfort.",
    category: "Hoodie",
    priceCents: 4900,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    name: "Sweatshirt",
    description:
      "A classic crewneck sweatshirt in soft brushed fleece — a clean, unlined canvas for bold graphics.",
    category: "Sweatshirt",
    priceCents: 4200,
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
  },
  {
    name: "Tank Top",
    description:
      "A slim-fit tank with a deep scoop neckline and open armholes — lightweight and perfect for summer prints.",
    category: "Tank Top",
    priceCents: 2200,
    sizes: ["XS", "S", "M", "L", "XL"],
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.id))
      .first();
  },
});

/** Seeds the catalog if it is empty (idempotent). */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return { seeded: false };

    for (const [index, product] of CATALOG.entries()) {
      await ctx.db.insert("products", {
        slug: product.category.toLowerCase().replace(/\s+/g, "-"),
        name: product.name,
        description: product.description,
        category: product.category,
        priceCents: product.priceCents,
        sizes: product.sizes,
        colors: SHIRT_COLORS,
        modelPath: undefined,
        thumbnail: undefined,
        active: true,
        sortOrder: index,
      });
    }
    return { seeded: true };
  },
});
