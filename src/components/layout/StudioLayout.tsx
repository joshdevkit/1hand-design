import { useState } from "react";
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Three-column studio shell: tool sidebar | 3D workspace | properties panel.
 * Sidebars collapse on desktop and become slide-out drawers on smaller
 * screens, keeping the viewport prioritized.
 */
export function StudioLayout({
  toolbar,
  leftPanel,
  rightPanel,
  children,
  rootRef,
}: {
  toolbar: React.ReactNode;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  children: React.ReactNode;
  rootRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div ref={rootRef} className="flex h-screen flex-col bg-workspace">
      {toolbar}

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left panel — desktop */}
        <div
          className={cn(
            "hidden overflow-hidden transition-[width] duration-200 lg:block",
            leftOpen ? "w-[300px] shrink-0" : "w-0",
          )}
        >
          {leftOpen && <div className="h-full">{leftPanel}</div>}
        </div>

        {/* Left panel — mobile drawer */}
        {leftOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setLeftOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] border-r border-border bg-surface shadow-pop">
              {leftPanel}
            </div>
          </div>
        )}

        {/* Center workspace */}
        <div className="flex-1 p-3">{children}</div>

        {/* Right panel — desktop */}
        <div
          className={cn(
            "hidden overflow-hidden transition-[width] duration-200 lg:block",
            rightOpen ? "w-[320px] shrink-0" : "w-0",
          )}
        >
          {rightOpen && <div className="h-full">{rightPanel}</div>}
        </div>

        {/* Right panel — mobile drawer */}
        {rightOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setRightOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-72 max-w-[85%] border-l border-border bg-surface shadow-pop">
              {rightPanel}
            </div>
          </div>
        )}

        {/* Desktop collapse toggles */}
        <button
          onClick={() => setLeftOpen((open) => !open)}
          className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
          aria-label="Toggle tools panel"
        >
          <span
            className={cn(
              "flex h-8 w-5 items-center justify-center rounded-r-md border border-border border-l-0 bg-surface text-muted-fg shadow-sm transition-colors hover:text-foreground",
              leftOpen && "translate-x-full",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </span>
        </button>
        <button
          onClick={() => setRightOpen((open) => !open)}
          className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
          aria-label="Toggle properties panel"
        >
          <span
            className={cn(
              "flex h-8 w-5 items-center justify-center rounded-l-md border border-border border-r-0 bg-surface text-muted-fg shadow-sm transition-colors hover:text-foreground",
              rightOpen && "-translate-x-full",
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      {/* Mobile panel toggles */}
      <div className="flex items-center justify-between border-t border-border bg-surface px-3 py-1.5 lg:hidden">
        <Button variant="ghost" size="sm" onClick={() => setLeftOpen(true)}>
          <PanelLeft className="h-3.5 w-3.5" />
          Tools
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setRightOpen(true)}>
          <PanelRight className="h-3.5 w-3.5" />
          Properties
        </Button>
      </div>
    </div>
  );
}
