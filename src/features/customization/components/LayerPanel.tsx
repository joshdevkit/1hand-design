import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  ImageIcon,
  Shapes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { useCustomization } from "@/features/customization/hooks/useCustomization";
import { REGIONS } from "@/features/three-d/types/three-d.types";
import { elementDisplayName } from "@/features/customization/utils/designUtils";
import { cn } from "@/lib/utils";
import type { DesignElement } from "@/types";

function ElementIcon({ kind }: { kind: DesignElement["kind"] }) {
  if (kind === "text") return <Type className="h-3.5 w-3.5" />;
  if (kind === "graphic") return <Shapes className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
}

/** Professional layers panel — every element gets its own layer row. */
export function LayerPanel() {
  const {
    elements,
    selectedElementId,
    selectElement,
    toggleVisible,
    toggleLock,
    duplicateElement,
    removeElement,
    bringForward,
    sendBackward,
  } = useCustomization();

  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Shapes className="h-5 w-5" />}
        title="No layers yet"
        description="Upload artwork, add text, or insert graphics — every element appears here as a layer."
      />
    );
  }

  return (
    <div className="space-y-1">
      {sorted.map((element, index) => {
        const isSelected = element.id === selectedElementId;
        return (
          <div
            key={element.id}
            onClick={() => selectElement(element.id)}
            className={cn(
              "group flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors cursor-pointer",
              isSelected ? "border-accent bg-accent-soft/30" : "border-border hover:bg-surface-2",
            )}
          >
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleVisible(element.id);
              }}
              className="text-muted-fg hover:text-foreground"
              aria-label={element.visible ? "Hide layer" : "Show layer"}
            >
              {element.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleLock(element.id);
              }}
              className="text-muted-fg hover:text-foreground"
              aria-label={element.locked ? "Unlock layer" : "Lock layer"}
            >
              {element.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <ElementIcon kind={element.kind} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {elementDisplayName(element, index + 1)}
              </p>
              <p className="truncate text-[10px] text-muted-fg">{REGIONS[element.region].label}</p>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  sendBackward(element.id);
                }}
                className="rounded p-1 text-muted-fg hover:bg-surface-2 hover:text-foreground"
                aria-label="Send backward"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  bringForward(element.id);
                }}
                className="rounded p-1 text-muted-fg hover:bg-surface-2 hover:text-foreground"
                aria-label="Bring forward"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  duplicateElement(element.id);
                }}
                className="rounded p-1 text-muted-fg hover:bg-surface-2 hover:text-foreground"
                aria-label="Duplicate layer"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  removeElement(element.id);
                }}
                className="rounded p-1 text-muted-fg hover:bg-surface-2 hover:text-danger"
                aria-label="Delete layer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
