import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Pencil, Copy, Trash2, Plus } from "lucide-react";
import { useDesigns, useDesignService } from "@/features/designs/hooks/useDesigns";
import { useProducts } from "@/features/products/hooks/useProducts";
import { GarmentThumb } from "@/features/products/components/ProductCard";
import { LoadingState, EmptyState, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { DesignRecord } from "@/types";

export function MyDesignsPage() {
  const navigate = useNavigate();
  const { data: designs, loading, error, reload } = useDesigns();
  const { deleteDesign, duplicateDesign } = useDesignService();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDelete = async (design: DesignRecord) => {
    setBusyId(design.id);
    try {
      await deleteDesign(design.id);
      toast.success("Design deleted");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (design: DesignRecord) => {
    setBusyId(design.id);
    try {
      const copy = await duplicateDesign(design.id);
      toast.success("Design duplicated");
      navigate(`/studio/${copy.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Duplication failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Studio</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">My Designs</h1>
          <p className="max-w-2xl text-sm text-muted-fg">
            Reopen any saved design to keep editing — shirt, colors, artwork, text, and placements
            all restore exactly as you left them.
          </p>
        </div>
        <Button onClick={() => navigate("/studio")}>
          <Plus className="h-4 w-4" />
          New Design
        </Button>
      </header>

      {loading && <LoadingState label="Loading your designs" />}
      {error && (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="Designs unavailable"
          description={error.message}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      )}

      {!loading && !error && designs && designs.length === 0 && (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="No designs yet"
          description="Open the studio, customize a garment, and save your first design to see it here."
          action={
            <Button onClick={() => navigate("/studio")}>
              <Plus className="h-4 w-4" />
              Create a design
            </Button>
          }
        />
      )}

      {!loading && !error && designs && designs.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => {
            return (
              <div
                key={design.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <button
                  onClick={() => navigate(`/studio/${design.id}`)}
                  className="relative flex items-center justify-center bg-surface-2 px-6 pt-8"
                  aria-label={`Open ${design.name}`}
                >
                  <GarmentThumb
                    product={{ category: design.productType }}
                    className="h-32 w-auto text-foreground"
                  />
                  <span
                    className="absolute bottom-3 right-3 h-6 w-6 rounded-full border border-border bg-surface/90 shadow-sm"
                    style={{ backgroundColor: design.shirtColor }}
                  />
                </button>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-sm font-semibold">{design.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-fg">
                        {design.productType} · {formatDate(design.updatedAt)}
                      </p>
                    </div>
                    <Badge variant="muted">{design.config.elements.length} layers</Badge>
                  </div>
                  <div className="mt-auto flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 justify-center"
                      onClick={() => navigate(`/studio/${design.id}`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      disabled={busyId === design.id}
                      onClick={() => void handleDuplicate(design)}
                      aria-label="Duplicate design"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-danger hover:text-danger"
                          disabled={busyId === design.id}
                          aria-label="Delete design"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Delete this design?"
                      description={`"${design.name}" will be permanently removed.`}
                      confirmLabel="Delete"
                      destructive
                      onConfirm={() => void handleDelete(design)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
