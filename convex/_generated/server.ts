/* Hand-written stand-in for Convex's generated server module.
 * Running `npx convex dev` regenerates this file with schema-typed builders.
 * The runtime behavior is identical — Convex registers functions from the
 * convex/ directory by module path and export name. */
import { actionGeneric, mutationGeneric, queryGeneric } from "convex/server";
import type {
  ActionBuilder,
  GenericMutationCtx,
  GenericQueryCtx,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";
import type { Database } from "./dataModel";

export const query = queryGeneric as unknown as QueryBuilder<Database, "public">;
export const mutation = mutationGeneric as unknown as MutationBuilder<Database, "public">;
export const action = actionGeneric as unknown as ActionBuilder<Database, "public">;

export type QueryCtx = GenericQueryCtx<Database>;
export type MutationCtx = GenericMutationCtx<Database>;
