// scripts/verify-db.ts
// Direct node script to verify database connection without running HTTP server

import { query, queryScalar, verifyConnection, verifySchema, closePool } from "../lib/db";

async function main() {
  console.log("=== PostgreSQL Read-Only Verification ===");

  try {
    // 1. Connection check
    console.log("\n1. Verifying Database Connection...");
    const connection = await verifyConnection();

    if (!connection.connected) {
      console.error("❌ Connection failed:", connection.error);
      process.exit(1);
    }

    console.log("✅ Connected successfully!");
    console.log(`- Database Name: ${connection.database}`);
    console.log(`- Version: ${connection.version?.split(",")[0]}`);

    // 2. Schema check (tables exist)
    console.log("\n2. Verifying Table Existence (public schema)...");
    const schema = await verifySchema();

    for (const [table, exists] of Object.entries(schema.tables)) {
      console.log(`- ${table}: ${exists ? "✅ EXISTS" : "❌ MISSING"}`);
    }

    if (!schema.tablesExist) {
      console.error("❌ One or more required tables are missing!");
      process.exit(1);
    }

    // 3. Row count checks (SELECT COUNT(*) only)
    console.log("\n3. Verifying Row Counts (SELECT COUNT(*))...");
    const [adminCount, categoryCount, productCount, messageCount] =
      await Promise.all([
        queryScalar<number>("SELECT COUNT(*) FROM tb_admin;"),
        queryScalar<number>("SELECT COUNT(*) FROM tb_category;"),
        queryScalar<number>("SELECT COUNT(*) FROM tb_product;"),
        queryScalar<number>("SELECT COUNT(*) FROM tb_message;"),
      ]);

    console.log(`- tb_admin: ${adminCount} records`);
    console.log(`- tb_category: ${categoryCount} records`);
    console.log(`- tb_product: ${productCount} records`);
    console.log(`- tb_message: ${messageCount} records`);

    // 4. Column verification through information_schema
    console.log("\n4. Verifying Expected Columns...");
    const tables = ["tb_admin", "tb_category", "tb_product", "tb_message"];

    for (const table of tables) {
      const cols = await query<{ column_name: string }>(
        "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position;",
        [table]
      );
      console.log(
        `- ${table} columns: ${cols.map((c) => c.column_name).join(", ")}`
      );
    }

    console.log("\n=== ALL READ-ONLY CHECKS PASSED ===");
    console.log("Database schema and data remain untouched.");
  } catch (error) {
    console.error("Verification encountered an unexpected error:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
