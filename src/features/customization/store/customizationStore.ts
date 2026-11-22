import { create } from "zustand";
import type { DesignElement, DesignRecord, Product, RegionId } from "@/types";
import { DEFAULT_SHIRT_COLOR } from "@/features/customization/utils/designConstants";

/**
 * Customization store — the single source of truth for the studio.
 *
 * Design-relevant state (product, shirt color, elements) is versioned for
 * undo/redo via immutable snapshots. Transient state (selection, viewport
 * settings) lives outside history. High-frequency interactions (dragging,
 * camera rotation) stay local to the client and never hit the backend.
 */

export interface DesignSnapshot {
  product: Product | null;
  shirtColor: string;
  elements: DesignElement[];
}

interface CustomizationState {
  // Live design state
  product: Product | null;
  shirtColor: string;
  elements: DesignElement[];
  activeRegion: RegionId;
  selectedElementId: string | null;
  recentColors: string[];
  autoRotate: boolean;
  saving: boolean;
  dirty: boolean;

  // History
  past: DesignSnapshot[];
  future: DesignSnapshot[];

  // Lifecycle
  initStudio: (product: Product, record?: DesignRecord | null) => void;

  // Product & color
  setProduct: (product: Product) => void;
  setShirtColor: (hex: string) => void;

  // Elements
  addElement: (element: DesignElement) => void;
  updateElement: (id: string, patch: Partial<DesignElement>, commit?: boolean) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setActiveRegion: (region: RegionId) => void;

  // Layer operations
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  toggleVisible: (id: string) => void;
  toggleLock: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  resetDesign: () => void;

  // Persistence helpers
  markSaved: () => void;
  snapshotForSave: () => {
    productId: string;
    productType: Product["category"];
    shirtColor: string;
    elements: DesignElement[];
    assetIds: string[];
  } | null;
}

const HISTORY_LIMIT = 60;

function currentSnapshot(state: CustomizationState): DesignSnapshot {
  return {
    product: state.product,
    shirtColor: state.shirtColor,
    elements: [...state.elements],
  };
}

function applySnapshot(state: CustomizationState, snapshot: DesignSnapshot): Partial<CustomizationState> {
  return {
    product: snapshot.product,
    shirtColor: snapshot.shirtColor,
    elements: [...snapshot.elements],
  };
}

function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export const useCustomizationStore = create<CustomizationState>((set, get) => ({
  product: null,
  shirtColor: DEFAULT_SHIRT_COLOR,
  elements: [],
  activeRegion: "front",
  selectedElementId: null,
  recentColors: [],
  autoRotate: false,
  saving: false,
  dirty: false,

  past: [],
  future: [],

  initStudio: (product, record) => {
    if (record) {
      set({
        product,
        shirtColor: record.shirtColor || product.colors[0]?.hex || DEFAULT_SHIRT_COLOR,
        elements: record.config.elements.map((element) => ({ ...element })),
        activeRegion: "front",
        selectedElementId: null,
        recentColors: get().recentColors,
        autoRotate: false,
        saving: false,
        dirty: false,
        past: [],
        future: [],
      });
      return;
    }
    set({
      product,
      shirtColor: product.colors[0]?.hex ?? DEFAULT_SHIRT_COLOR,
      elements: [],
      activeRegion: "front",
      selectedElementId: null,
      autoRotate: false,
      saving: false,
      dirty: false,
      past: [],
      future: [],
    });
  },

  setProduct: (product) => {
    const state = get();
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      product,
      shirtColor: product.colors[0]?.hex ?? DEFAULT_SHIRT_COLOR,
      elements: [],
      selectedElementId: null,
      activeRegion: "front",
      dirty: true,
    });
  },

  setShirtColor: (hex) => {
    const color = normalizeHex(hex);
    const state = get();
    const recentColors = [color, ...state.recentColors.filter((c) => c !== color)].slice(0, 8);
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      shirtColor: color,
      recentColors,
      dirty: true,
    });
  },

  addElement: (element) => {
    const state = get();
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      elements: [...state.elements, element],
      selectedElementId: element.id,
      dirty: true,
    });
  },

  updateElement: (id, patch, commit = true) => {
    const state = get();
    const past = commit
      ? [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT)
      : state.past;
    set({
      past,
      future: commit ? [] : state.future,
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, ...patch } : element,
      ),
      dirty: true,
    });
  },

  removeElement: (id) => {
    const state = get();
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      elements: state.elements.filter((element) => element.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      dirty: true,
    });
  },

  duplicateElement: (id) => {
    const state = get();
    const source = state.elements.find((element) => element.id === id);
    if (!source) return;
    const copy: DesignElement = {
      ...source,
      id: `el_${Math.random().toString(36).slice(2, 10)}`,
      name: `${source.name} Copy`,
      x: Math.min(0.92, source.x + 0.06),
      y: Math.min(0.92, source.y + 0.06),
      zIndex: source.zIndex + 1,
    };
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      elements: [...state.elements, copy],
      selectedElementId: copy.id,
      dirty: true,
    });
  },

  selectElement: (id) => set({ selectedElementId: id }),

  setActiveRegion: (region) => set({ activeRegion: region }),

  bringForward: (id) => {
    const state = get();
    const sorted = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
    const index = sorted.findIndex((element) => element.id === id);
    if (index === -1 || index === sorted.length - 1) return;
    const target = sorted[index + 1];
    const elements = state.elements.map((element) => {
      if (element.id === id) return { ...element, zIndex: target.zIndex };
      if (element.id === target.id) return { ...element, zIndex: element.zIndex - 1 };
      return element;
    });
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      elements,
      dirty: true,
    });
  },

  sendBackward: (id) => {
    const state = get();
    const sorted = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
    const index = sorted.findIndex((element) => element.id === id);
    if (index <= 0) return;
    const target = sorted[index - 1];
    const elements = state.elements.map((element) => {
      if (element.id === id) return { ...element, zIndex: target.zIndex };
      if (element.id === target.id) return { ...element, zIndex: element.zIndex + 1 };
      return element;
    });
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      elements,
      dirty: true,
    });
  },

  toggleVisible: (id) => {
    const state = get();
    set({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, visible: !element.visible } : element,
      ),
      dirty: true,
    });
  },

  toggleLock: (id) => {
    const state = get();
    set({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, locked: !element.locked } : element,
      ),
    });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const previous = state.past[state.past.length - 1];
    set({
      past: state.past.slice(0, -1),
      future: [currentSnapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
      ...applySnapshot(state, previous),
      dirty: true,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
      ...applySnapshot(state, next),
      dirty: true,
    });
  },

  resetDesign: () => {
    const state = get();
    const product = state.product;
    if (!product) return;
    set({
      past: [...state.past, currentSnapshot(state)].slice(-HISTORY_LIMIT),
      future: [],
      shirtColor: product.colors[0]?.hex ?? DEFAULT_SHIRT_COLOR,
      elements: [],
      selectedElementId: null,
      dirty: true,
    });
  },

  markSaved: () => set({ dirty: false }),

  snapshotForSave: () => {
    const state = get();
    const product = state.product;
    if (!product) return null;
    const assetIds = state.elements
      .filter((element) => element.assetId)
      .map((element) => element.assetId as string);
    return {
      productId: product.id,
      productType: product.category,
      shirtColor: state.shirtColor,
      elements: state.elements,
      assetIds: [...new Set(assetIds)],
    };
  },
}));
