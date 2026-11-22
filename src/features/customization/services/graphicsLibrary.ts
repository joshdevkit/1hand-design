/**
 * Built-in graphics library — original SVG artwork, organized by category.
 * Graphics use `fill="currentColor"` so they can be tinted at draw time.
 * Inserted graphics behave exactly like uploaded artwork (move, resize,
 * rotate, opacity, layers).
 */

export interface GraphicDefinition {
  id: string;
  name: string;
  category: "Shapes" | "Symbols" | "Patterns" | "Fashion";
  svg: string;
}

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="currentColor">${inner}</g></svg>`;

export const GRAPHICS_LIBRARY: GraphicDefinition[] = [
  // Shapes
  {
    id: "shape-star",
    name: "Star",
    category: "Shapes",
    svg: wrap(
      '<path d="M50 8 L61.8 38.2 L93 38.2 L67.9 57.3 L76.2 88 L50 70.4 L23.8 88 L32.1 57.3 L7 38.2 L38.2 38.2 Z"/>',
    ),
  },
  {
    id: "shape-circle",
    name: "Circle",
    category: "Shapes",
    svg: wrap('<circle cx="50" cy="50" r="42"/>'),
  },
  {
    id: "shape-square",
    name: "Square",
    category: "Shapes",
    svg: wrap('<rect x="14" y="14" width="72" height="72" rx="10"/>'),
  },
  {
    id: "shape-triangle",
    name: "Triangle",
    category: "Shapes",
    svg: wrap('<path d="M50 12 L90 86 L10 86 Z"/>'),
  },
  {
    id: "shape-diamond",
    name: "Diamond",
    category: "Shapes",
    svg: wrap('<path d="M50 10 L90 50 L50 90 L10 50 Z"/>'),
  },
  {
    id: "shape-hexagon",
    name: "Hexagon",
    category: "Shapes",
    svg: wrap(
      '<path d="M50 10 L84.5 27.5 L84.5 72.5 L50 90 L15.5 72.5 L15.5 27.5 Z"/>',
    ),
  },
  {
    id: "shape-ring",
    name: "Ring",
    category: "Shapes",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="14"/></svg>`,
  },
  {
    id: "shape-plus",
    name: "Plus",
    category: "Shapes",
    svg: wrap('<rect x="42" y="12" width="16" height="76" rx="4"/><rect x="12" y="42" width="76" height="16" rx="4"/>'),
  },

  // Symbols
  {
    id: "symbol-heart",
    name: "Heart",
    category: "Symbols",
    svg: wrap(
      '<path d="M50 88 C20 64 12 44 22 30 C32 18 44 22 50 34 C56 22 68 18 78 30 C88 44 80 64 50 88 Z"/>',
    ),
  },
  {
    id: "symbol-bolt",
    name: "Bolt",
    category: "Symbols",
    svg: wrap('<path d="M58 6 L24 54 L44 54 L38 94 L76 42 L54 42 Z"/>'),
  },
  {
    id: "symbol-leaf",
    name: "Leaf",
    category: "Symbols",
    svg: wrap('<path d="M50 8 C70 20 84 40 84 62 C84 80 70 92 50 92 C34 92 22 82 18 64 C14 44 28 22 50 8 Z"/>'),
  },
  {
    id: "symbol-flame",
    name: "Flame",
    category: "Symbols",
    svg: wrap('<path d="M50 6 C62 26 78 34 78 56 C78 72 68 84 50 92 C32 84 22 72 22 56 C22 46 28 42 34 48 C40 38 44 26 50 6 Z"/>'),
  },
  {
    id: "symbol-arrow",
    name: "Arrow",
    category: "Symbols",
    svg: wrap('<path d="M50 10 L88 50 L66 50 L66 90 L34 90 L34 50 L12 50 Z"/>'),
  },
  {
    id: "symbol-smile",
    name: "Smile",
    category: "Symbols",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="currentColor"/><g fill="#17191D"><circle cx="34" cy="40" r="5"/><circle cx="66" cy="40" r="5"/><path d="M30 62 Q50 80 70 62 L70 66 Q50 84 30 66 Z"/></g></svg>`,
  },

  // Patterns
  {
    id: "pattern-dots",
    name: "Dot Grid",
    category: "Patterns",
    svg: wrap(
      '<circle cx="25" cy="25" r="8"/><circle cx="50" cy="25" r="8"/><circle cx="75" cy="25" r="8"/><circle cx="25" cy="50" r="8"/><circle cx="50" cy="50" r="8"/><circle cx="75" cy="50" r="8"/><circle cx="25" cy="75" r="8"/><circle cx="50" cy="75" r="8"/><circle cx="75" cy="75" r="8"/>',
    ),
  },
  {
    id: "pattern-wave",
    name: "Wave",
    category: "Patterns",
    svg: wrap(
      '<path d="M0 50 Q12.5 28 25 50 T50 50 T75 50 T100 50 V100 H0 Z M0 66 Q12.5 44 25 66 T50 66 T75 66 T100 66 V100 H0 Z"/>',
    ),
  },
  {
    id: "pattern-stripes",
    name: "Stripes",
    category: "Patterns",
    svg: wrap('<rect x="0" y="0" width="100" height="100"/><g fill="#ffffff" opacity="0.85"><rect x="0" y="22" width="100" height="11"/><rect x="0" y="55" width="100" height="11"/><rect x="0" y="77" width="100" height="11"/></g>'),
  },

  // Fashion
  {
    id: "fashion-tag",
    name: "Price Tag",
    category: "Fashion",
    svg: wrap(
      '<path d="M50 12 L88 12 L88 50 Q88 70 68 70 L54 70 L46 88 L30 88 L46 70 L32 70 Q22 70 22 50 L22 12 Z"/><circle cx="38" cy="42" r="6" fill="#ffffff"/>',
    ),
  },
  {
    id: "fashion-spark",
    name: "Sparkle",
    category: "Fashion",
    svg: wrap(
      '<path d="M50 6 L56 44 L94 50 L56 56 L50 94 L44 56 L6 50 L44 44 Z"/>',
    ),
  },
  {
    id: "fashion-shield",
    name: "Shield",
    category: "Fashion",
    svg: wrap('<path d="M50 8 L84 20 L84 50 Q84 74 50 92 Q16 74 16 50 L16 20 Z"/>'),
  },
];

export const GRAPHIC_CATEGORIES = ["Shapes", "Symbols", "Patterns", "Fashion"] as const;

export function findGraphic(id: string): GraphicDefinition | undefined {
  return GRAPHICS_LIBRARY.find((graphic) => graphic.id === id);
}

export function graphicSvgById(id: string): string | undefined {
  return findGraphic(id)?.svg;
}
