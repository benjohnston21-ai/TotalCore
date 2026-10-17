import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const isWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

function connect() {
  const client = postgres(process.env.DATABASE_URL!, {
    max: 5,
    // Let idle connections go quickly so per-request clients on Workers don't linger.
    idle_timeout: isWorkers ? 5 : undefined,
  });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof connect>;

// Cloudflare Workers can't share a socket between requests, so there each
// request gets its own client, keyed on the request's execution context.
// Everywhere else one pool is reused (and survives dev hot reloads).
const perRequest = new WeakMap<object, Db>();
const globalForDb = globalThis as unknown as { totalcoreDb?: Db };

function getDb(): Db {
  if (isWorkers) {
    const { ctx } = getCloudflareContext();
    let db = perRequest.get(ctx);
    if (!db) {
      db = connect();
      perRequest.set(ctx, db);
    }
    return db;
  }
  return (globalForDb.totalcoreDb ??= connect());
}

export const db = new Proxy({} as Db, {
  get(_, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
