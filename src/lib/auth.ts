import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

/**
 * Identity seam.
 *
 * In a deployed Convex environment, user identity is provided by Convex Auth
 * (JWT) and `ctx.auth.getUserIdentity()` inside mutations; the ownership
 * checks in `convex/designs.ts` etc. are written against that API.
 *
 * For local development without a Convex auth provider, a stable local
 * identity is generated and persisted in the browser so ownership semantics
 * (designs/cart/orders scoped per user) still hold end to end.
 */
interface IdentityState {
  user: UserProfile;
  setProfile: (patch: Partial<Pick<UserProfile, "name" | "email">>) => void;
}

function createLocalIdentity(): UserProfile {
  return {
    id: `local_${Math.random().toString(36).slice(2, 10)}`,
    name: "Local Designer",
    email: null,
    createdAt: Date.now(),
  };
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set, get) => ({
      user: createLocalIdentity(),
      setProfile: (patch) =>
        set((state) => ({ user: { ...state.user, ...patch } })),
    }),
    { name: "threadlab-identity" },
  ),
);

/** Current user id — safe to call from components and backend calls. */
export function useUserId(): string {
  return useIdentityStore((state) => state.user.id);
}

export function useUserProfile(): UserProfile {
  return useIdentityStore((state) => state.user);
}
