import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Resolves the acting user id from the Convex auth identity.
 *
 * Production deployments must configure Convex Auth (JWT provider) — every
 * ownership-scoped mutation calls this and never trusts a user-submitted id.
 *
 * When no auth provider is configured (e.g. a bare local `convex dev` run),
 * mutations fall back to a fixed dev identity so the app remains usable in
 * development. This fallback is intentionally a constant, never client input.
 */
export const DEV_FALLBACK_USER = "dev-user";

export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth?.getUserIdentity();
  return identity?.subject ?? DEV_FALLBACK_USER;
}

export async function optionalUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth?.getUserIdentity();
  return identity?.subject ?? null;
}
