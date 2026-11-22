import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { prepareArtwork, ArtworkRejectedError } from "@/features/customization/services/artworkService";
import { createArtworkElement } from "@/features/customization/utils/designUtils";
import { storeArtworkAsset } from "@/features/customization/services/artworkService";
import { useBackend } from "@/app/providers/ConvexProvider";
import { useUserId } from "@/lib/auth";
import { useCustomization } from "@/features/customization/hooks/useCustomization";

/** Drag-and-drop + browser artwork upload for the studio. */
export function ArtworkUploader() {
  const backend = useBackend();
  const userId = useUserId();
  const { activeRegion, addElement } = useCustomization();
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      try {
        for (const file of files) {
          const artwork = await prepareArtwork(file);
          // Persist the asset through the backend (storage in Convex mode).
          let assetId: string | undefined;
          try {
            assetId = await storeArtworkAsset(backend, userId, artwork);
          } catch (error) {
            console.warn("[threadlab] asset storage failed, keeping local copy", error);
          }
          addElement(
            createArtworkElement({
              imageData: artwork.dataUrl,
              name: file.name.replace(/\.[^.]+$/, ""),
              region: activeRegion,
              assetId,
            }),
          );
        }
        toast.success(
          files.length === 1 ? "Artwork added to your design" : `${files.length} artworks added`,
        );
      } catch (error) {
        if (error instanceof ArtworkRejectedError) {
          toast.error(error.message);
        } else {
          toast.error(error instanceof Error ? error.message : "Upload failed");
        }
      } finally {
        setUploading(false);
      }
    },
    [backend, userId, activeRegion, addElement],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => void handleFiles(accepted),
    onDropRejected: () => toast.error("Dropped files are not supported (PNG, JPG, JPEG, SVG, WEBP)"),
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
      "image/webp": [".webp"],
    },
    noClick: true,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors " +
          (isDragActive
            ? "border-accent bg-accent-soft/40"
            : "border-border bg-surface-2/50 hover:border-muted")
        }
      >
        <input {...getInputProps()} />
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-accent shadow-sm">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {isDragActive ? "Drop to add artwork" : "Drop artwork here"}
          </p>
          <p className="text-xs text-muted-fg">PNG · JPG · JPEG · SVG · WEBP</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full justify-center"
        disabled={uploading}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp";
          input.multiple = true;
          input.onchange = () => {
            if (input.files) void handleFiles(Array.from(input.files));
          };
          input.click();
        }}
      >
        <ImageIcon className="h-4 w-4" />
        {uploading ? "Uploading…" : "Browse files"}
      </Button>
    </div>
  );
}
