// lib/db.ts
// PostgreSQL database abstraction layer for Next.js
// Server-side only. Never import from Client Components.

import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

/**
 * Get or create PostgreSQL connection pool
 * Uses DATABASE_URL environment variable with singleton pattern for serverless environments
 */
function getPool(): Pool {
  if (!globalThis.__pgPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Check .env file."
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const isRemote = !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");
    const sslConfig = isProduction && isRemote ? { rejectUnauthorized: false } : undefined;

    globalThis.__pgPool = new Pool({
      connectionString: databaseUrl,
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: sslConfig,
    });

    globalThis.__pgPool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  return globalThis.__pgPool;
}

/**
 * Execute a read-only query with parameterized statements
 * Returns rows matching the query
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const dbPool = getPool();

  try {
    // Type-safe query execution with generic parameter
    const result = await dbPool.query(sql, params);
    return result.rows as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error(
      `Database query failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Execute a single row query
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Get scalar value (single cell)
 */
export async function queryScalar<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await queryOne<Record<string, T>>(sql, params);
  if (!result) return null;

  const firstValue = Object.values(result)[0];
  return firstValue as T;
}

/**
 * Verify database connectivity and schema
 * Read-only verification for Phase 2
 */
export async function verifyConnection(): Promise<{
  connected: boolean;
  database: string | null;
  version: string | null;
  error: string | null;
}> {
  try {
    const dbName = await queryScalar<string>(
      "SELECT current_database();"
    );
    const version = await queryScalar<string>(
      "SELECT version();"
    );

    return {
      connected: true,
      database: dbName,
      version: version,
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      database: null,
      version: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify all required tables exist
 */
export async function verifySchema(): Promise<{
  tablesExist: boolean;
  tables: {
    [key: string]: boolean;
  };
  error: string | null;
}> {
  try {
    const requiredTables = [
      "tb_admin",
      "tb_category",
      "tb_product",
      "tb_message",
    ];

    const tables: { [key: string]: boolean } = {};

    for (const table of requiredTables) {
      const result = await queryScalar<number>(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public';",
        [table]
      );
      tables[table] = (result ?? 0) > 0;
    }

    const allExist = Object.values(tables).every((exists) => exists);

    return {
      tablesExist: allExist,
      tables,
      error: null,
    };
  } catch (error) {
    return {
      tablesExist: false,
      tables: {},
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Close database pool
 * Call on application shutdown
 */
export async function closePool(): Promise<void> {
  if (globalThis.__pgPool) {
    await globalThis.__pgPool.end();
    globalThis.__pgPool = undefined;
  }
}

const db = {
  query,
  queryOne,
  queryScalar,
  verifyConnection,
  verifySchema,
  closePool,
};

export default db;
