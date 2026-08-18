import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Single Drizzle Postgres instance. This is the only file allowed to touch
 * the `pg` driver directly - every feature imports `db` from here and its
 * own tables from its own features/<name>/db/schema.ts. Swapping driver or
 * host (e.g. to Supabase's Postgres) later is a one-file change here.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export const db = createDb();

/** Throws with a clear message instead of a null-reference error when a feature needs the DB but DATABASE_URL isn't set. */
export function requireDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not set. Any feature with a db/schema.ts requires Postgres - see .env.example."
    );
  }
  return db;
}
