import { useCallback } from "react";
import { useBackend } from "@/app/providers/ConvexProvider";
import { useUserId } from "@/lib/auth";
import { useAsync } from "@/hooks/useAsync";
import type { DesignRecord } from "@/types";
import type { NewDesignInput, UpdateDesignInput } from "@/lib/backend";

export function useDesigns() {
  const backend = useBackend();
  const userId = useUserId();

  return useAsync<DesignRecord[]>(() => backend.designs.list(userId), [backend, userId]);
}

export function useDesign(designId: string | undefined) {
  const backend = useBackend();
  return useAsync<DesignRecord | null>(
    () => (designId ? backend.designs.get(designId) : Promise.resolve(null)),
    [backend, designId],
  );
}

/** Design save/load operations — all persistence goes through the backend. */
export function useDesignService() {
  const backend = useBackend();
  const userId = useUserId();

  const createDesign = useCallback(
    async (input: Omit<NewDesignInput, "userId">) =>
      backend.designs.create({ ...input, userId }),
    [backend, userId],
  );

  const updateDesign = useCallback(
    async (id: string, patch: UpdateDesignInput) => backend.designs.update(id, patch),
    [backend],
  );

  const deleteDesign = useCallback((id: string) => backend.designs.remove(id), [backend]);

  const duplicateDesign = useCallback(
    (id: string) => backend.designs.duplicate(id, userId),
    [backend, userId],
  );

  return { createDesign, updateDesign, deleteDesign, duplicateDesign };
}
