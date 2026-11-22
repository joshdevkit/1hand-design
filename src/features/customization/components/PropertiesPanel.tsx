import { useRef } from "react";
import {
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ImageIcon,
  Type,
  Shapes,
  Shirt,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FONT_OPTIONS } from "@/lib/constants";
import { ColorPicker } from "@/features/customization/components/ColorPicker";
import { useCustomization } from "@/features/customization/hooks/useCustomization";
import { POSITION_PRESETS } from "@/features/customization/utils/designUtils";
import { REGIONS } from "@/features/three-d/types/three-d.types";
import { formatPrice } from "@/lib/utils";

/** Small labeled number input with live + committed updates. */
function NumberField({
  label,
  value,
  min,
  max,
  step = 0.01,
  onLiveChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onLiveChange: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? Number(value.toFixed(3)) : 0}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onLiveChange(next);
        }}
        onBlur={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onCommit(next);
        }}
      />
    </div>
  );
}

/** Slider field that updates live during drag and commits on release. */
function SliderField({
  label,
  value,
  min,
  max,
  step = 0.01,
  format,
  onLiveChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onLiveChange: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  const latestRef = useRef(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-[11px] text-muted-fg">
          {format ? format(latestRef.current) : latestRef.current.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          latestRef.current = next[0];
          onLiveChange(next[0]);
        }}
        onPointerUp={() => onCommit(latestRef.current)}
      />
    </div>
  );
}

function ActionRow({ onDuplicate, onDelete, onForward, onBackward }: {
  onDuplicate: () => void;
  onDelete: () => void;
  onForward: () => void;
  onBackward: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={onForward}>
        <ArrowUp className="h-3.5 w-3.5" />
        Forward
      </Button>
      <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={onBackward}>
        <ArrowDown className="h-3.5 w-3.5" />
        Back
      </Button>
      <Button variant="outline" size="sm" className="px-2" onClick={onDuplicate} aria-label="Duplicate">
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="sm" className="px-2 text-danger" onClick={onDelete} aria-label="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function QuickPositions({ onSelect }: { onSelect: (presetId: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>Quick position</Label>
      <div className="flex flex-wrap gap-1.5">
        {POSITION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-fg transition-colors hover:border-accent hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Right sidebar — contextual editing options for the selected object. */
export function PropertiesPanel({ onNavigateBack }: { onNavigateBack?: () => void }) {
  const {
    product,
    shirtColor,
    recentColors,
    setShirtColor,
    selectedElement,
    updateSelected,
    removeElement,
    duplicateElement,
    bringForward,
    sendBackward,
    elements,
    activeRegion,
  } = useCustomization();

  const region = REGIONS[activeRegion];

  return (
    <aside className="studio-panel flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-3">
        <p className="text-xs font-semibold">Properties</p>
        {onNavigateBack && (
          <Button variant="ghost" size="sm" className="md:hidden" onClick={onNavigateBack}>
            Close
          </Button>
        )}
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto p-3">
        {!selectedElement ? (
          <ShirtProperties
            product={product}
            shirtColor={shirtColor}
            recentColors={recentColors}
            onShirtColor={setShirtColor}
            region={region.label}
            layerCount={elements.length}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selectedElement.kind === "text" ? (
                <Type className="h-4 w-4 text-accent" />
              ) : selectedElement.kind === "graphic" ? (
                <Shapes className="h-4 w-4 text-accent" />
              ) : (
                <ImageIcon className="h-4 w-4 text-accent" />
              )}
              <div>
                <p className="text-sm font-semibold">{selectedElement.name}</p>
                <p className="text-[11px] text-muted-fg">
                  {selectedElement.kind === "artwork"
                    ? "Artwork"
                    : selectedElement.kind === "text"
                      ? "Text"
                      : "Graphic"}{" "}
                  · {REGIONS[selectedElement.region].label}
                </p>
              </div>
            </div>

            <QuickPositions
              onSelect={(presetId) => {
                const preset = POSITION_PRESETS.find((p) => p.id === presetId);
                if (preset) {
                  updateSelected({ x: preset.x, y: preset.y }, true);
                }
              }}
            />

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Position X"
                value={selectedElement.x}
                min={0}
                max={1}
                onLiveChange={(value) => updateSelected({ x: value }, false)}
                onCommit={(value) => updateSelected({ x: value }, true)}
              />
              <NumberField
                label="Position Y"
                value={selectedElement.y}
                min={0}
                max={1}
                onLiveChange={(value) => updateSelected({ y: value }, false)}
                onCommit={(value) => updateSelected({ y: value }, true)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Width"
                value={selectedElement.width}
                min={0.02}
                max={1}
                onLiveChange={(value) => updateSelected({ width: value }, false)}
                onCommit={(value) => updateSelected({ width: value }, true)}
              />
              <NumberField
                label="Height"
                value={selectedElement.height}
                min={0.02}
                max={1}
                onLiveChange={(value) => updateSelected({ height: value }, false)}
                onCommit={(value) => updateSelected({ height: value }, true)}
              />
            </div>

            <SliderField
              label="Rotation"
              value={selectedElement.rotation}
              min={-180}
              max={180}
              step={1}
              format={(value) => `${value.toFixed(0)}°`}
              onLiveChange={(value) => updateSelected({ rotation: value }, false)}
              onCommit={(value) => updateSelected({ rotation: value }, true)}
            />

            <SliderField
              label="Opacity"
              value={selectedElement.opacity}
              min={0}
              max={1}
              step={0.01}
              format={(value) => `${Math.round(value * 100)}%`}
              onLiveChange={(value) => updateSelected({ opacity: value }, false)}
              onCommit={(value) => updateSelected({ opacity: value }, true)}
            />

            {selectedElement.kind === "artwork" && (
              <div className="space-y-2">
                <Label>Artwork</Label>
                <div className="checker-bg flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border">
                  {selectedElement.imageData && (
                    <img
                      src={selectedElement.imageData}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {selectedElement.kind === "graphic" && (
              <div className="space-y-2">
                <Label>Graphic color</Label>
                <ColorPicker
                  value={selectedElement.text?.color ?? "#17191D"}
                  onChange={(color) =>
                    updateSelected({ text: { ...selectedElement.text!, color } }, true)
                  }
                />
              </div>
            )}

            {selectedElement.kind === "text" && selectedElement.text && (
              <TextProperties
                text={selectedElement.text}
                onUpdate={(patch, commit) =>
                  updateSelected({ text: { ...selectedElement.text!, ...patch } }, commit)
                }
              />
            )}

            <Separator />

            <ActionRow
              onDuplicate={() => duplicateElement(selectedElement.id)}
              onDelete={() => removeElement(selectedElement.id)}
              onForward={() => bringForward(selectedElement.id)}
              onBackward={() => sendBackward(selectedElement.id)}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function TextProperties({
  text,
  onUpdate,
}: {
  text: NonNullable<import("@/types").DesignElement["text"]>;
  onUpdate: (
    patch: Partial<NonNullable<import("@/types").DesignElement["text"]>>,
    commit: boolean,
  ) => void;
}) {
  const update = (patch: Partial<typeof text>, commit = true) =>
    onUpdate({ ...text, ...patch }, commit);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea
          value={text.content}
          onChange={(event) => update({ content: event.target.value }, false)}
          onBlur={(event) => update({ content: event.target.value }, true)}
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Font family</Label>
        <Select value={text.fontFamily} onValueChange={(value) => update({ fontFamily: value }, true)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.label} value={font.label}>
                <span style={{ fontFamily: font.family }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SliderField
        label="Font size"
        value={text.fontSize}
        min={6}
        max={48}
        step={1}
        format={(value) => `${value.toFixed(0)}`}
        onLiveChange={(value) => update({ fontSize: value }, false)}
        onCommit={(value) => update({ fontSize: value }, true)}
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Weight</Label>
          <Select
            value={String(text.fontWeight)}
            onValueChange={(value) => update({ fontWeight: Number(value) }, true)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="400">Regular</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Style</Label>
          <Select
            value={text.italic ? "italic" : "normal"}
            onValueChange={(value) => update({ italic: value === "italic" }, true)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="italic">Italic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Text color</Label>
        <ColorPicker value={text.color} onChange={(color) => update({ color }, true)} />
      </div>

      <div className="space-y-1.5">
        <Label>Alignment</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => update({ align }, true)}
              className={
                "rounded-md border py-1.5 text-xs font-medium capitalize transition-colors " +
                (text.align === align
                  ? "border-accent bg-accent-soft/40 text-foreground"
                  : "border-border text-muted-fg hover:text-foreground")
              }
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      <SliderField
        label="Letter spacing"
        value={text.letterSpacing}
        min={-10}
        max={30}
        step={1}
        format={(value) => `${value.toFixed(0)}`}
        onLiveChange={(value) => update({ letterSpacing: value }, false)}
        onCommit={(value) => update({ letterSpacing: value }, true)}
      />

      <SliderField
        label="Line height"
        value={text.lineHeight}
        min={80}
        max={200}
        step={5}
        format={(value) => `${value.toFixed(0)}%`}
        onLiveChange={(value) => update({ lineHeight: value }, false)}
        onCommit={(value) => update({ lineHeight: value }, true)}
      />

      <div className="space-y-1.5">
        <Label>Background</Label>
        <Select
          value={text.backgroundColor ?? "none"}
          onValueChange={(value) =>
            update({ backgroundColor: value === "none" ? null : value }, true)
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="#FFFFFF">White</SelectItem>
            <SelectItem value="#17191D">Black</SelectItem>
            <SelectItem value="#FDE68A">Yellow</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ShirtProperties({
  product,
  shirtColor,
  recentColors,
  onShirtColor,
  region,
  layerCount,
}: {
  product: { name: string; category: string; priceCents: number } | null;
  shirtColor: string;
  recentColors: string[];
  onShirtColor: (hex: string) => void;
  region: string;
  layerCount: number;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Shirt color</Label>
          <ColorPicker value={shirtColor} onChange={onShirtColor} recentColors={recentColors} />
        </div>
        <div
          className="flex items-center gap-3 rounded-lg border border-border p-3"
          style={{ backgroundColor: shirtColor }}
        >
          <span className="h-10 w-10 rounded-md border border-border/40 shadow-sm" style={{ backgroundColor: shirtColor }} />
          <div>
            <p className="text-xs font-medium">Live material</p>
            <p className="text-[11px] text-muted-fg">Updates the 3D shirt in real time</p>
          </div>
        </div>
      </div>

      {product && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-accent" />
            <p className="text-xs font-semibold">{product.name}</p>
          </div>
          <p className="text-[11px] text-muted-fg">{product.category}</p>
          <p className="text-sm font-medium">{formatPrice(product.priceCents)}</p>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-accent" />
          <p className="text-xs font-semibold">Print surface</p>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-fg">
          New artwork, text, and graphics land on the <span className="font-medium text-foreground">{region}</span> surface.
          Switch surfaces in the left toolbar.
        </p>
        <p className="text-[11px] text-muted-fg">
          {layerCount} layer{layerCount === 1 ? "" : "s"} in this design.
        </p>
      </div>
    </div>
  );
}
