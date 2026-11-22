/* Hand-written stand-in for Convex's generated API reference.
 * Running `npx convex dev` regenerates this file with typed references to
 * every function in convex/*.ts. This stand-in mirrors the runtime shape —
 * a plain tree of function references — so client code (`client.query`,
 * `client.mutation`, `useQuery`) is wired identically. Until a deployment is
 * generated, any resolution throws a clear error; the app only reaches this
 * module when a Convex deployment is configured.
 *
 * The function kinds below match the builders used in convex/*.ts exactly. */
import type { FunctionReference } from "convex/server";

type Args = Record<string, unknown>;
type Q = FunctionReference<"query", "public", Args, unknown>;
type M = FunctionReference<"mutation", "public", Args, unknown>;

function notInitialized(): never {
  throw new Error(
    "Convex API is not initialized. Run `npx convex dev` to generate the API reference and connect a deployment.",
  );
}

/** Builds a FunctionReference-shaped proxy node (never resolved here). */
function makeRef<Type extends Q["_type"] | M["_type"]>(
  type: Type,
): FunctionReference<Type, "public", Args, unknown> {
  const base: Record<string, unknown> = {
    _type: type,
    _visibility: "public",
    _componentPath: undefined,
  };
  return new Proxy(base, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (prop in target) return target[prop];
      return makeRef(type);
    },
  }) as FunctionReference<Type, "public", Args, unknown>;
}

export const api = {
  users: { get: makeRef("query"), ensureProfile: makeRef("mutation") },
  products: { list: makeRef("query"), get: makeRef("query"), seed: makeRef("mutation") },
  designs: {
    list: makeRef("query"),
    get: makeRef("query"),
    create: makeRef("mutation"),
    update: makeRef("mutation"),
    remove: makeRef("mutation"),
    duplicate: makeRef("mutation"),
  },
  designAssets: {
    list: makeRef("query"),
    url: makeRef("query"),
    createUploadUrl: makeRef("mutation"),
    register: makeRef("mutation"),
    remove: makeRef("mutation"),
  },
  cart: {
    list: makeRef("query"),
    add: makeRef("mutation"),
    setQuantity: makeRef("mutation"),
    remove: makeRef("mutation"),
    clear: makeRef("mutation"),
  },
  orders: { list: makeRef("query"), create: makeRef("mutation") },
} as const satisfies Record<string, Record<string, Q | M>>;

export const internal = api;
