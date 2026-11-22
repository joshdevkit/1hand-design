import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SHIRT_COLOR_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  recentColors?: string[];
  presets?: ReadonlyArray<{ name: string; hex: string }>;
  className?: string;
}

/** Compact color picker: swatch trigger opening a popover with hex, native
 *  picker, presets, and recently used colors. */
export function ColorPicker({
  value,
  onChange,
  recentColors = [],
  presets = SHIRT_COLOR_PRESETS,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);

  const commitHex = () => {
    const trimmed = hexInput.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
      onChange(trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
    } else {
      setHexInput(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 w-full justify-between gap-2 overflow-hidden", className)}
        >
          <span className="flex items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-xs">{value.toUpperCase()}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="h-8 w-10 cursor-pointer rounded-md border border-border bg-surface p-0.5"
              aria-label="Native color picker"
            />
            <Input
              value={hexInput}
              onChange={(event) => setHexInput(event.target.value)}
              onBlur={commitHex}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitHex();
              }}
              className="font-mono"
              placeholder="#000000"
            />
          </div>

          {recentColors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-fg">Recently used</p>
              <div className="flex flex-wrap gap-1.5">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChange(color)}
                    className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-fg">Presets</p>
            <div className="grid grid-cols-6 gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => onChange(preset.hex)}
                  title={preset.name}
                  className={cn(
                    "relative h-7 w-7 rounded-md border border-border transition-transform hover:scale-110",
                    value.toLowerCase() === preset.hex.toLowerCase() && "ring-2 ring-accent ring-offset-1",
                  )}
                  style={{ backgroundColor: preset.hex }}
                >
                  {value.toLowerCase() === preset.hex.toLowerCase() && (
                    <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-foreground mix-blend-difference" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
