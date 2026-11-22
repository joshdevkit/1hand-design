import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FONT_OPTIONS } from "@/lib/constants";
import { createTextElement } from "@/features/customization/utils/designUtils";
import { useCustomization } from "@/features/customization/hooks/useCustomization";
import { toast } from "sonner";

/** Add-text control with a live font preview. */
export function TextEditor() {
  const { activeRegion, addElement } = useCustomization();

  const handleAdd = () => {
    addElement(createTextElement({ region: activeRegion }));
    toast.success("Text element added");
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-muted-fg">Font preview</p>
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2/60 px-3 py-2">
          <span className="font-display text-lg font-semibold">THREADLAB</span>
          <span className="font-serif text-sm italic">Aa</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {FONT_OPTIONS.map((font) => (
          <div
            key={font.label}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-muted-fg"
          >
            <span className="text-sm" style={{ fontFamily: font.family }}>
              {font.label}
            </span>
            <span className="font-mono text-[10px]">{font.label === "Inter" ? "sans" : font.label === "Newsreader" ? "serif" : "display"}</span>
          </div>
        ))}
      </div>

      <Button className="w-full justify-center" onClick={handleAdd}>
        <Type className="h-4 w-4" />
        Add Text
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-fg">
        Text lands on the {activeRegion} surface. Edit content, font, size, and color in the
        properties panel.
      </p>
    </div>
  );
}
