import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Only create pool if DATABASE_URL is set
let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

// Export db only if pool exists, otherwise export null
export const db = pool ? drizzle(pool, { schema }) : null;

