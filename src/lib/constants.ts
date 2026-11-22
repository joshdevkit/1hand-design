export const BRAND = {
  name: "THREADLAB",
  tagline: "Design apparel in real-time 3D",
  description:
    "A professional digital apparel studio — select a garment, recolor it, place artwork and text on real 3D fabric, and rotate your design through a full 360 degrees before you save or order.",
};

export const NAV_LINKS = [
  { href: "/studio", label: "Studio" },
  { href: "/catalog", label: "Catalog" },
  { href: "/designs", label: "My Designs" },
  { href: "/cart", label: "Cart" },
] as const;

export const APPAREL_CATEGORIES = [
  "Classic T-Shirt",
  "Oversized T-Shirt",
  "Polo Shirt",
  "Long Sleeve",
  "Hoodie",
  "Sweatshirt",
  "Tank Top",
] as const;

export type ApparelCategory = (typeof APPAREL_CATEGORIES)[number];

/** Shirt color palette offered in the studio (presets beyond user uploads). */
export const SHIRT_COLOR_PRESETS = [
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
] as const;

export const FONT_OPTIONS = [
  { label: "Inter", family: '"Inter Variable", Inter, sans-serif' },
  { label: "Space Grotesk", family: '"Space Grotesk Variable", "Space Grotesk", sans-serif' },
  { label: "Newsreader", family: '"Newsreader Variable", Newsreader, serif' },
] as const;

export const TEXT_SIZE_RANGE = { min: 8, max: 120 } as const;
