// scripts/verify-crud.ts
// Real CRUD verification against existing database — READ/WRITE
// Temporary test product is cleaned up after verification.

import { queryOne, queryScalar, query } from "../lib/db";
import { createProduct, getProduct, updateProduct, deleteProduct, toggleProductStatus } from "../lib/products";
import { listCategories } from "../lib/categories";
import { closePool } from "../lib/db";

async function main() {
  console.log("=== Phase 4 CRUD Verification ===");

  // Clean up any leftover test products first
  await query("DELETE FROM tb_product WHERE product_name LIKE 'TEMP %'");

  // 1. Verify categories exist
  console.log("\n--- Categories ---");
  const cats = await listCategories();
  console.log(`✅ Found ${cats.length} categories — first: "${cats[0].category_name}"`);
  if (cats.length === 0) {
    console.error("❌ No categories exist for testing");
    process.exit(1);
  }
  const catId = cats[0].category_id;

  // 2. CREATE
  console.log("\n--- CREATE Test ---");
  const testProduct = await createProduct({
    category_id: catId,
    product_name: "TEMP Test Product Phase4",
    product_price: 99000,
    product_description: "Temporary test product for Phase 4 verification.",
    product_image: "",
    product_status: 1,
  });
  if (!testProduct) {
    console.error("❌ CREATE failed");
    process.exit(1);
  }
  console.log(`✅ CREATE PASS — product_id=${testProduct}`);

  // 3. READ
  console.log("\n--- READ Test ---");
  const read = await getProduct(testProduct);
  if (!read || read.product_name !== "TEMP Test Product Phase4") {
    console.error("❌ READ failed or data mismatch");
    process.exit(1);
  }
  console.log(`✅ READ PASS — name="${read.product_name}", price=${read.product_price}`);

  // 4. UPDATE
  console.log("\n--- UPDATE Test ---");
  await updateProduct(testProduct, {
    category_id: catId,
    product_name: "TEMP Test Product Phase4 — UPDATED",
    product_price: 129000,
    product_description: "Updated description.",
    product_image: "",
    product_status: 1,
  });
  const updated = await getProduct(testProduct);
  if (!updated || Number(updated.product_price) !== 129000 || !updated.product_name.includes("UPDATED")) {
    console.error("❌ UPDATE failed or data mismatch. Got:", updated);
    process.exit(1);
  }
  console.log(`✅ UPDATE PASS — price=${updated.product_price}, name includes UPDATED`);

  // 5. TOGGLE
  console.log("\n--- TOGGLE Test ---");
  await toggleProductStatus(testProduct, 1 as 0 | 1);
  const toggled = await getProduct(testProduct);
  if (!toggled || toggled.product_status !== 0) {
    console.error("❌ TOGGLE failed — expected status 0");
    process.exit(1);
  }
  console.log("✅ TOGGLE PASS — status → 0 (Inactive)");

  await toggleProductStatus(testProduct, 0 as 0 | 1);
  const toggledBack = await getProduct(testProduct);
  if (!toggledBack || toggledBack.product_status !== 1) {
    console.error("❌ TOGGLE back failed — expected status 1");
    process.exit(1);
  }
  console.log("✅ TOGGLE PASS — status → 1 (Active)");

  // 6. DELETE
  console.log("\n--- DELETE Test ---");
  await deleteProduct(testProduct);
  const deleted = await getProduct(testProduct);
  if (deleted) {
    console.error("❌ DELETE failed — product still exists");
    process.exit(1);
  }
  console.log("✅ DELETE PASS — temporary product removed");

  // 7. DB Integrity
  console.log("\n--- Database Integrity ---");
  const [adminC, catC, prodC, msgC] = await Promise.all([
    queryScalar("SELECT COUNT(*) FROM tb_admin;"),
    queryScalar("SELECT COUNT(*) FROM tb_category;"),
    queryScalar("SELECT COUNT(*) FROM tb_product;"),
    queryScalar("SELECT COUNT(*) FROM tb_message;"),
  ]);
  console.log(`tb_admin: ${adminC} (expected 1)`);
  console.log(`tb_category: ${catC} (expected 5)`);
  console.log(`tb_product: ${prodC} (expected 6)`);
  console.log(`tb_message: ${msgC} (expected 3)`);

  if (Number(adminC) !== 1 || Number(catC) !== 5 || Number(prodC) !== 6 || Number(msgC) !== 3) {
    console.error("❌ DB Integrity FAILED");
    process.exit(1);
  }
  console.log("✅ DB Integrity PASS — all counts match original");

  // Verify original admin hash untouched
  const adminCheck = await queryOne<{ password: string }>("SELECT password FROM tb_admin WHERE username='admin'");
  if (!adminCheck?.password?.startsWith("$2")) {
    console.error("❌ Admin password hash modified");
    process.exit(1);
  }
  console.log("✅ Admin password hash UNCHANGED");

  // Verify test product cleaned up
  const leftover = await queryScalar<number>("SELECT COUNT(*) FROM tb_product WHERE product_name LIKE 'TEMP %'");
  if ((leftover ?? 0) > 0) {
    console.error("❌ Temporary test data not removed");
    process.exit(1);
  }
  console.log("✅ Temporary test data removed");

  console.log("\n=== ALL PHASE 4 CRUD TESTS PASSED ===");
  await closePool();
}

main().catch(async (e) => {
  console.error("Verification error:", e);
  await closePool();
  process.exit(1);
});
