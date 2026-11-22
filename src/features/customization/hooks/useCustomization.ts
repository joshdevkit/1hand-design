import { useCallback } from "react";
import { useCustomizationStore } from "@/features/customization/store/customizationStore";
import type { DesignElement, Product, RegionId } from "@/types";

/**
 * Typed accessor for the customization store. Components consume the store
 * through this hook so selectors stay stable and rerenders stay minimal.
 */
export function useCustomization() {
  const product = useCustomizationStore((state) => state.product);
  const shirtColor = useCustomizationStore((state) => state.shirtColor);
  const elements = useCustomizationStore((state) => state.elements);
  const activeRegion = useCustomizationStore((state) => state.activeRegion);
  const selectedElementId = useCustomizationStore((state) => state.selectedElementId);
  const recentColors = useCustomizationStore((state) => state.recentColors);
  const autoRotate = useCustomizationStore((state) => state.autoRotate);
  const saving = useCustomizationStore((state) => state.saving);
  const dirty = useCustomizationStore((state) => state.dirty);
  const canUndo = useCustomizationStore((state) => state.past.length > 0);
  const canRedo = useCustomizationStore((state) => state.future.length > 0);

  const initStudio = useCustomizationStore((state) => state.initStudio);
  const setProduct = useCustomizationStore((state) => state.setProduct);
  const setShirtColor = useCustomizationStore((state) => state.setShirtColor);
  const addElement = useCustomizationStore((state) => state.addElement);
  const updateElement = useCustomizationStore((state) => state.updateElement);
  const removeElement = useCustomizationStore((state) => state.removeElement);
  const duplicateElement = useCustomizationStore((state) => state.duplicateElement);
  const selectElement = useCustomizationStore((state) => state.selectElement);
  const setActiveRegion = useCustomizationStore((state) => state.setActiveRegion);
  const bringForward = useCustomizationStore((state) => state.bringForward);
  const sendBackward = useCustomizationStore((state) => state.sendBackward);
  const toggleVisible = useCustomizationStore((state) => state.toggleVisible);
  const toggleLock = useCustomizationStore((state) => state.toggleLock);
  const undo = useCustomizationStore((state) => state.undo);
  const redo = useCustomizationStore((state) => state.redo);
  const resetDesign = useCustomizationStore((state) => state.resetDesign);
  const markSaved = useCustomizationStore((state) => state.markSaved);
  const snapshotForSave = useCustomizationStore((state) => state.snapshotForSave);

  const selectedElement = elements.find((element) => element.id === selectedElementId) ?? null;

  const updateSelected = useCallback(
    (patch: Partial<DesignElement>, commit = true) => {
      if (selectedElementId) updateElement(selectedElementId, patch, commit);
    },
    [selectedElementId, updateElement],
  );

  return {
    product,
    shirtColor,
    elements,
    activeRegion,
    selectedElementId,
    selectedElement,
    recentColors,
    autoRotate,
    saving,
    dirty,
    canUndo,
    canRedo,
    initStudio,
    setProduct,
    setShirtColor,
    addElement,
    updateElement,
    updateSelected,
    removeElement,
    duplicateElement,
    selectElement,
    setActiveRegion,
    bringForward,
    sendBackward,
    toggleVisible,
    toggleLock,
    undo,
    redo,
    resetDesign,
    markSaved,
    snapshotForSave,
  };
}

export type CustomizationController = ReturnType<typeof useCustomization>;

/** Convenience hook for components that only need region selection. */
export function useActiveRegion(): RegionId {
  return useCustomizationStore((state) => state.activeRegion);
}

/** Convenience hook for the current product. */
export function useStudioProduct(): Product | null {
  return useCustomizationStore((state) => state.product);
}
