/* Hand-written stand-in for Convex's generated data model.
 * Running `npx convex dev` regenerates this file from convex/schema.ts with
 * full index/column typing. Keep it in sync with the schema so the app
 * typechecks without a live deployment. */
import type { DataModelFromSchemaDefinition } from "convex/server";
import type { GenericId } from "convex/values";
import type { schema } from "../schema";

export type Database = DataModelFromSchemaDefinition<typeof schema>;
export type DatabaseTables = Database["tables"];

export type Id<TableName extends keyof DatabaseTables> = GenericId<TableName>;
