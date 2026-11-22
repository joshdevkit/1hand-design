/**
 * Artwork service — validates uploaded files and prepares them for the
 * design pipeline (PNG / JPG / JPEG / SVG / WEBP).
 *
 * Raster images are downscaled to a sane working resolution so textures stay
 * performant; SVGs are kept as-is and rasterized at draw time.
 */

export interface PreparedArtwork {
  dataUrl: string;
  name: string;
  contentType: string;
  width: number;
  height: number;
}

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
];

const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".webp"];

const MAX_DIMENSION = 1600;

export class ArtworkRejectedError extends Error {}

export function isAcceptedFile(file: File): boolean {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return (
    ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension)
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function downscaleRaster(
  dataUrl: string,
  contentType: string,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const { width, height } = image;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      if (scale === 1) {
        resolve({ dataUrl, width, height });
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl, width, height });
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      // PNG keeps transparency for artwork; JPEG/WEBP stay compact.
      const exported = contentType === "image/png"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/webp", 0.92);
      resolve({ dataUrl: exported, width: canvas.width, height: canvas.height });
    };
    image.onerror = () => reject(new Error("Failed to decode image"));
    image.src = dataUrl;
  });
}

export async function prepareArtwork(file: File): Promise<PreparedArtwork> {
  if (!isAcceptedFile(file)) {
    throw new ArtworkRejectedError(
      "Unsupported file type. Use PNG, JPG, JPEG, SVG, or WEBP.",
    );
  }

  const dataUrl = await readAsDataUrl(file);
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

  if (isSvg) {
    return { dataUrl, name: file.name, contentType: "image/svg+xml", width: 100, height: 100 };
  }

  const prepared = await downscaleRaster(dataUrl, file.type || "image/png");
  return {
    dataUrl: prepared.dataUrl,
    name: file.name,
    contentType: prepared.dataUrl.startsWith("data:image/webp") ? "image/webp" : "image/png",
    width: prepared.width,
    height: prepared.height,
  };
}

/** Stores prepared artwork through the backend asset pipeline. */
export async function storeArtworkAsset(
  backend: {
    designAssets: {
      store: (input: {
        userId: string;
        name: string;
        contentType: string;
        dataUrl: string;
        kind: "artwork" | "preview";
      }) => Promise<{ id: string }>;
    };
  },
  userId: string,
  artwork: PreparedArtwork,
): Promise<string> {
  const asset = await backend.designAssets.store({
    userId,
    name: artwork.name,
    contentType: artwork.contentType,
    dataUrl: artwork.dataUrl,
    kind: "artwork",
  });
  return asset.id;
}
