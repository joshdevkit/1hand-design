import type { DatabaseTables, Id } from "../_generated/dataModel";

/**
 * Casts a plain string id to the branded Convex Id type. Client-facing ids
 * arrive as plain strings; at runtime Convex accepts them, and this helper
 * keeps the server code type-safe.
 */
export function asId<TableName extends keyof DatabaseTables>(value: string): Id<TableName> {
  return value as Id<TableName>;
}
