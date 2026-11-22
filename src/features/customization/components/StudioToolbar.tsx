import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Undo2,
  Redo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Camera,
  Save,
  Download,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared";
import { toast } from "sonner";
import { useDesignHistory } from "@/features/customization/hooks/useDesignHistory";
import { useCustomization } from "@/features/customization/hooks/useCustomization";
import { useDesignService } from "@/features/designs/hooks/useDesigns";
import { useCartService } from "@/features/cart/hooks/useCart";
import { useBackend } from "@/app/providers/ConvexProvider";
import { useUserId } from "@/lib/auth";
import { toDesignRecordInput } from "@/features/customization/utils/designUtils";
import { downloadRegionArtwork, storePreviewAssets } from "@/features/customization/services/designExportService";
import { formatPrice, downloadDataUrl } from "@/lib/utils";
import type { ViewportHandle, ViewPreset } from "@/features/three-d/types/three-d.types";

/** Full editor toolbar — every control performs a real action. */
export function StudioToolbar({
  viewportRef,
  designId,
  designName,
  onDesignSaved,
}: {
  viewportRef: React.RefObject<ViewportHandle | null>;
  designId: string | null;
  designName: string;
  onDesignSaved: (id: string, name: string) => void;
}) {
  const navigate = useNavigate();
  const { canUndo, canRedo, undo, redo, resetDesign } = useDesignHistory();
  const { product, shirtColor, elements, autoRotate, snapshotForSave, markSaved } =
    useCustomization();
  const { createDesign, updateDesign } = useDesignService();
  const { addToCart } = useCartService();
  const backend = useBackend();
  const userId = useUserId();

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState(designName);
  const [saving, setSaving] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartSize, setCartSize] = useState<string>("");
  const [cartQty, setCartQty] = useState(1);

  const setView = (view: ViewPreset) => viewportRef.current?.setView(view);

  const handleSave = async () => {
    if (!product) {
      toast.error("Select a product first");
      return;
    }
    const snapshot = snapshotForSave();
    if (!snapshot) return;

    setSaving(true);
    try {
      // Generate front/back previews through the backend asset pipeline.
      let frontId: string | null = null;
      let backId: string | null = null;
      try {
        const [front, back] = await Promise.all([
          viewportRef.current?.captureViewport("front") ?? Promise.resolve(null),
          viewportRef.current?.captureViewport("back") ?? Promise.resolve(null),
        ]);
        const previews = await storePreviewAssets(backend, userId, saveName, front, back);
        frontId = previews.frontId;
        backId = previews.backId;
      } catch (error) {
        console.warn("[threadlab] preview generation failed", error);
      }

      const input = toDesignRecordInput(
        {
          name: saveName,
          productId: snapshot.productId,
          productType: snapshot.productType,
          shirtColor: snapshot.shirtColor,
          config: { shirtColor: snapshot.shirtColor, elements: snapshot.elements },
        },
        snapshot.assetIds,
      );

      if (designId) {
        await updateDesign(designId, {
          name: saveName,
          shirtColor: snapshot.shirtColor,
          config: input.config,
          assetIds: snapshot.assetIds,
          previewFrontId: frontId,
          previewBackId: backId,
        });
        onDesignSaved(designId, saveName);
        toast.success("Design saved");
      } else {
        const created = await createDesign(input);
        markSaved();
        onDesignSaved(created.id, saveName);
        toast.success("Design saved");
        navigate(`/studio/${created.id}`);
      }
      setSaveOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPreview = async () => {
    const dataUrl = await viewportRef.current?.captureViewport("current");
    if (!dataUrl) {
      toast.error("Viewport is not ready");
      return;
    }
    downloadDataUrl(dataUrl, `${designName || "threadlab"}-preview.png`);
    toast.success("Preview exported");
  };

  const handleExportPreviews = async () => {
    const [front, back] = await Promise.all([
      viewportRef.current?.captureViewport("front") ?? Promise.resolve(null),
      viewportRef.current?.captureViewport("back") ?? Promise.resolve(null),
    ]);
    if (!front && !back) {
      toast.error("Viewport is not ready");
      return;
    }
    if (front) downloadDataUrl(front, `${designName || "threadlab"}-front.png`);
    if (back) downloadDataUrl(back, `${designName || "threadlab"}-back.png`);
    toast.success("Front and back previews exported");
  };

  const handleExportArtwork = async () => {
    if (elements.length === 0) {
      toast.error("Add artwork, text, or graphics before exporting");
      return;
    }
    try {
      const count = await downloadRegionArtwork(elements, shirtColor, designName || "design");
      toast.success(`${count} print region${count === 1 ? "" : "s"} exported`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  };

  const openCart = () => {
    if (product) setCartSize(product.sizes[0] ?? "M");
    setCartOpen(true);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const snapshot = snapshotForSave();
    if (!snapshot) return;
    try {
      let preview: string | null = null;
      try {
        preview = (await viewportRef.current?.captureViewport("front")) ?? null;
      } catch {
        preview = null;
      }
      await addToCart({
        productId: product.id,
        productName: product.name,
        designId: designId,
        designName: designName,
        designPreview: preview,
        size: cartSize,
        color: shirtColor,
        quantity: cartQty,
        unitPriceCents: product.priceCents,
      });
      toast.success("Added to cart");
      setCartOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to cart");
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => navigate("/catalog")} aria-label="Back to catalog">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <Button variant="ghost" size="icon" disabled={!canUndo} onClick={undo} aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled={!canRedo} onClick={redo} aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label="Reset design">
              <RotateCcw className="h-4 w-4" />
            </Button>
          }
          title="Reset this design?"
          description="All artwork, text, and graphics will be removed. This can be undone."
          confirmLabel="Reset"
          destructive
          onConfirm={() => {
            resetDesign();
            toast.success("Design reset");
          }}
        />

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <Button variant="ghost" size="icon" onClick={() => viewportRef.current?.zoomIn()} aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => viewportRef.current?.zoomOut()} aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => viewportRef.current?.resetView()} aria-label="Reset camera">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant={autoRotate ? "secondary" : "ghost"}
          size="icon"
          onClick={() => viewportRef.current?.toggleAutoRotate()}
          aria-label="Toggle auto-rotate"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <div className="hidden items-center gap-0.5 sm:flex">
          <Button variant="ghost" size="sm" onClick={() => setView("front")}>
            <ArrowUp className="h-3.5 w-3.5" />
            Front
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setView("back")}>
            <ArrowDown className="h-3.5 w-3.5" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setView("left")}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setView("right")}>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Camera className="h-3.5 w-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => void handleExportPreview()}>
              <Download className="h-3.5 w-3.5" />
              PNG preview (current view)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleExportPreviews()}>
              <Download className="h-3.5 w-3.5" />
              Front & back previews
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleExportArtwork()}>
              <Download className="h-3.5 w-3.5" />
              Print artwork regions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={openCart}>
          <ShoppingBag className="h-3.5 w-3.5" />
          Add to cart
        </Button>

        <Button size="sm" onClick={() => setSaveOpen(true)} disabled={saving || !product}>
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Save dialog (also handles rename) */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{designId ? "Save design" : "Save new design"}</DialogTitle>
            <DialogDescription>
              The shirt, colors, artwork, text, and placements are persisted through Convex.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="design-name">Design name</Label>
            <Input
              id="design-name"
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving || saveName.trim().length === 0}>
              {saving ? "Saving…" : "Save design"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to cart dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to cart</DialogTitle>
            <DialogDescription>
              {product?.name} · {formatPrice(product?.priceCents ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={cartSize} onValueChange={setCartSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {(product?.sizes ?? []).map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Select value={String(cartQty)} onValueChange={(value) => setCartQty(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                    <SelectItem key={qty} value={String(qty)}>
                      {qty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border p-2.5">
              <span className="h-7 w-7 rounded-md border border-border" style={{ backgroundColor: shirtColor }} />
              <span className="text-xs text-muted-fg">
                {elements.length} design element{elements.length === 1 ? "" : "s"} on this garment
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleAddToCart()} disabled={!product}>
              Add to cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
