// app/api/verify/route.ts
// READ-ONLY database verification endpoint for Phase 2
// Strictly selects from tables, no mutations allowed

import { NextResponse } from "next/server";
import { query, queryScalar, verifyConnection, verifySchema } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  // Security guard: In production, diagnostic database inspection is disabled for unauthenticated users
  if (process.env.NODE_ENV === "production" && !(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    // 1. Connection check
    const connection = await verifyConnection();

    if (!connection.connected) {
      return NextResponse.json(
        {
          status: "FAIL",
          stage: "connection",
          error: connection.error,
          message: "Failed to connect to PostgreSQL database",
        },
        { status: 500 }
      );
    }

    // 2. Schema check (tables exist)
    const schema = await verifySchema();

    // 3. Count checks (SELECT COUNT(*) only)
    const [adminCount, categoryCount, productCount, messageCount] =
      await Promise.all([
        queryScalar<number>("SELECT COUNT(*) FROM tb_admin;"),
        queryScalar<number>("SELECT COUNT(*) FROM tb_category;"),
        queryScalar<number>("SELECT COUNT(*) FROM tb_product;"),
        queryScalar<number>("SELECT COUNT(*) FROM tb_message;"),
      ]);

    // 4. Detailed column verification
    const tableColumns: { [key: string]: string[] } = {};
    const tables = ["tb_admin", "tb_category", "tb_product", "tb_message"];

    for (const table of tables) {
      const cols = await query<{ column_name: string }>(
        "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position;",
        [table]
      );
      tableColumns[table] = cols.map((c) => c.column_name);
    }

    return NextResponse.json({
      status: "PASS",
      connection: {
        database: connection.database,
        version: connection.version,
      },
      counts: {
        tb_admin: adminCount,
        tb_category: categoryCount,
        tb_product: productCount,
        tb_message: messageCount,
      },
      schema: {
        tablesExist: schema.tablesExist,
        tables: schema.tables,
        columns: tableColumns,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Read-only verification failed",
      },
      { status: 500 }
    );
  }
}
