import { createContext, useContext, useMemo } from "react";
import { getBackend, isConvexConfigured } from "@/lib/backend";
import type { Backend } from "@/lib/backend";

interface ConvexContextValue {
  backend: Backend;
  /** True when persistence is wired to a real Convex deployment. */
  online: boolean;
}

const ConvexContext = createContext<ConvexContextValue | null>(null);

/**
 * Initializes the persistence layer. The backend is Convex whenever a
 * deployment is configured; otherwise the local offline implementation is
 * used so the studio remains fully functional (browser-local persistence).
 */
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ConvexContextValue>(() => {
    const backend = getBackend();
    return { backend, online: isConvexConfigured() };
  }, []);

  return <ConvexContext.Provider value={value}>{children}</ConvexContext.Provider>;
}

export function useBackend(): Backend {
  const context = useContext(ConvexContext);
  if (!context) {
    throw new Error("useBackend must be used within a ConvexProvider");
  }
  return context.backend;
}

export function useBackendOnline(): boolean {
  const context = useContext(ConvexContext);
  if (!context) {
    throw new Error("useBackendOnline must be used within a ConvexProvider");
  }
  return context.online;
}
