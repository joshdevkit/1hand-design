import {
  Shirt,
  Palette,
  UploadCloud,
  Type,
  Shapes,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts } from "@/features/products/hooks/useProducts";
import { GarmentThumb } from "@/features/products/components/ProductCard";
import { ColorPicker } from "@/features/customization/components/ColorPicker";
import { ArtworkUploader } from "@/features/customization/components/ArtworkUploader";
import { TextEditor } from "@/features/customization/components/TextEditor";
import { LayerPanel } from "@/features/customization/components/LayerPanel";
import { GRAPHICS_LIBRARY, GRAPHIC_CATEGORIES } from "@/features/customization/services/graphicsLibrary";
import { createGraphicElement } from "@/features/customization/utils/designUtils";
import { useCustomization } from "@/features/customization/hooks/useCustomization";
import { REGIONS, REGION_ORDER } from "@/features/three-d/types/three-d.types";
import { SHIRT_COLOR_PRESETS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RegionId } from "@/types";

/** Left sidebar — the complete design toolset. */
export function ToolSidebar({ onNavigateBack }: { onNavigateBack?: () => void }) {
  const { data: products } = useProducts();
  const {
    product,
    shirtColor,
    recentColors,
    setShirtColor,
    setProduct,
    activeRegion,
    setActiveRegion,
    addElement,
  } = useCustomization();

  return (
    <aside className="studio-panel flex h-full w-full flex-col">
      {onNavigateBack && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 justify-start gap-2 text-muted-fg md:hidden"
          onClick={onNavigateBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Tools
        </Button>
      )}

      {/* Surface selection */}
      <div className="border-b border-border p-3">
        <p className="mb-2 text-[11px] font-medium text-muted-fg">Print surface</p>
        <div className="grid grid-cols-2 gap-1.5">
          {REGION_ORDER.map((region: RegionId) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                activeRegion === region
                  ? "border-accent bg-accent-soft/40 text-foreground"
                  : "border-border text-muted-fg hover:text-foreground",
              )}
            >
              {REGIONS[region].label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="product" className="w-full">
          <div className="px-3 pt-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="product"><Shirt className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="colors"><Palette className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="upload"><UploadCloud className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="text"><Type className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="graphics"><Shapes className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="layers"><Layers className="h-3.5 w-3.5" /></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="product" className="mt-3 space-y-2 p-3">
            {products && products.length > 0 ? (
              products.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => {
                    setProduct(candidate);
                    toast.success(`Switched to ${candidate.name}`);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                    product?.id === candidate.id
                      ? "border-accent bg-accent-soft/30"
                      : "border-border hover:bg-surface-2",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-foreground">
                    <GarmentThumb product={candidate} className="h-7 w-auto" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{candidate.name}</span>
                    <span className="block truncate text-[10px] text-muted-fg">
                      {candidate.category}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-muted-fg">Loading products…</p>
            )}
          </TabsContent>

          <TabsContent value="colors" className="mt-3 space-y-3 p-3">
            <ColorPicker value={shirtColor} onChange={setShirtColor} recentColors={recentColors} />
            <div>
              <p className="mb-2 text-[11px] font-medium text-muted-fg">Shirt colors</p>
              <div className="grid grid-cols-4 gap-1.5">
                {SHIRT_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setShirtColor(preset.hex)}
                    title={preset.name}
                    className={cn(
                      "aspect-square rounded-md border transition-transform hover:scale-105",
                      shirtColor.toLowerCase() === preset.hex.toLowerCase()
                        ? "border-accent ring-2 ring-accent ring-offset-1"
                        : "border-border",
                    )}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-fg">
              The 3D shirt material updates immediately. The color syncs with your saved design.
            </p>
          </TabsContent>

          <TabsContent value="upload" className="mt-3 p-3">
            <ArtworkUploader />
          </TabsContent>

          <TabsContent value="text" className="mt-3 p-3">
            <TextEditor />
          </TabsContent>

          <TabsContent value="graphics" className="mt-3 space-y-3 p-3">
            {GRAPHIC_CATEGORIES.map((category) => (
              <div key={category} className="space-y-2">
                <p className="text-[11px] font-medium text-muted-fg">{category}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRAPHICS_LIBRARY.filter((g) => g.category === category).map((graphic) => (
                    <button
                      key={graphic.id}
                      onClick={() => {
                        addElement(
                          createGraphicElement({
                            graphicId: graphic.id,
                            region: activeRegion,
                            x: 0.5,
                            y: 0.5,
                          }),
                        );
                        toast.success(`${graphic.name} added`);
                      }}
                      title={graphic.name}
                      className="flex aspect-square items-center justify-center rounded-lg border border-border bg-surface-2 text-foreground transition-colors hover:border-accent hover:bg-accent-soft/30"
                      dangerouslySetInnerHTML={{ __html: graphic.svg }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="layers" className="mt-3 p-3">
            <LayerPanel />
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </aside>
  );
}
