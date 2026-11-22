/** Canvas 2D helpers for the artwork/texture rendering pipeline. */

const imageCache = new Map<string, HTMLImageElement>();

/** Loads an image (data URL or remote URL), caching successful loads. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageCache.set(src, image);
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 64)}`));
    image.src = src;
  });
}

export interface CanvasBox {
  /** Center x in canvas pixels. */
  x: number;
  /** Center y in canvas pixels. */
  y: number;
  w: number;
  h: number;
}

/** Runs a draw operation with the box rotated around its center. */
export function withRotation(
  ctx: CanvasRenderingContext2D,
  box: CanvasBox,
  rotationDegrees: number,
  draw: () => void,
): void {
  ctx.save();
  ctx.translate(box.x, box.y);
  ctx.rotate((rotationDegrees * Math.PI) / 180);
  ctx.translate(-box.x, -box.y);
  draw();
  ctx.restore();
}

/** Scales an image to fit inside a box, preserving aspect ratio. */
export function fitContain(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): { width: number; height: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { width: boxWidth, height: boxHeight };
  }
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  return { width: imageWidth * scale, height: imageHeight * scale };
}

/** Rounded rectangle with a safe fallback for older canvas implementations. */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.min(radius, w / 2, h / 2);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Formats a CSS font shorthand string for canvas. */
export function fontShorthand(
  family: string,
  sizePx: number,
  weight: number,
  italic: boolean,
): string {
  return `${italic ? "italic " : ""}${weight} ${sizePx}px ${family}`;
}
