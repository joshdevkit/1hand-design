import { useCallback } from "react";
import { useCustomizationStore } from "@/features/customization/store/customizationStore";

/** Undo/redo controls for the studio toolbar. */
export function useDesignHistory() {
  const canUndo = useCustomizationStore((state) => state.past.length > 0);
  const canRedo = useCustomizationStore((state) => state.future.length > 0);
  const undo = useCustomizationStore((state) => state.undo);
  const redo = useCustomizationStore((state) => state.redo);
  const resetDesign = useCustomizationStore((state) => state.resetDesign);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  return { canUndo, canRedo, undo: handleUndo, redo: handleRedo, resetDesign };
}
