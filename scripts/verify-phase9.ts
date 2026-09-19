// scripts/verify-phase9.ts
// Phase 9: Comprehensive Full Regression, Security, E2E & Vercel Readiness Suite
import fs from "fs/promises";
import path from "path";
import { query, queryOne, queryScalar, verifyConnection, verifySchema, closePool } from "../lib/db";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "../lib/products";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryExists,
} from "../lib/categories";
import { listMessages, deleteMessage, messageExists } from "../lib/messages";
import { submitContact } from "../lib/contact";
import { getAdminById, verifyPassword, updateAdminProfile } from "../lib/admin";
import { verifyBcryptPassword } from "../lib/auth";
import { getActiveProducts, getFeaturedProducts, getTotalActiveProducts } from "../lib/storefront";
import {
  PROTECTED_SEED_IMAGES,
  detectImageMagicBytes,
  hasSuspectScriptPayload,
  validateImage,
  generateSafeFilename,
  isValidSafeFilename,
} from "../lib/image-validation";
import {
  LocalStorageProvider,
  VercelBlobStorageProvider,
} from "../lib/storage";

const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

async function main() {
  console.log("=================================================================");
  console.log("   PHASE 9: FULL REGRESSION, SECURITY & READINESS TEST SUITE    ");
  console.log("=================================================================");

  let passCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, msg: string) {
    totalCount++;
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      process.exit(1);
    }
    console.log(`✅ PASS: ${msg}`);
    passCount++;
  }

  // Initial cleanup of any stale temporary data
  await query("DELETE FROM tb_product WHERE product_name LIKE 'TEST_PHASE9_%'");
  await query("DELETE FROM tb_category WHERE category_name LIKE 'TEST_PHASE9_%'");
  await query("DELETE FROM tb_message WHERE name LIKE 'TEST_PHASE9_%'");

  // -------------------------------------------------------------
  // SECTION 1: Database Pre-flight & Baseline Schema
  // -------------------------------------------------------------
  console.log("\n[SECTION 1: Database Pre-flight & Baseline Schema]");
  const conn = await verifyConnection();
  assert(conn.connected, "PostgreSQL connected successfully");
  const schema = await verifySchema();
  assert(schema.tablesExist, "All required tables exist (tb_admin, tb_category, tb_product, tb_message)");

  const [initialAdminC, initialCatC, initialProdC, initialMsgC] = await Promise.all([
    queryScalar<number>("SELECT COUNT(*) FROM tb_admin;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_category;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_product;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_message;"),
  ]);

  assert(Number(initialAdminC) === 1, "Baseline count: tb_admin = 1");
  assert(Number(initialCatC) === 5, "Baseline count: tb_category = 5");
  assert(Number(initialProdC) === 6, "Baseline count: tb_product = 6");
  assert(Number(initialMsgC) === 3, "Baseline count: tb_message = 3");

  const initialAdmin = await queryOne<{ password: string }>("SELECT password FROM tb_admin WHERE username='admin'");
  const originalAdminHash = initialAdmin?.password || "";
  assert(originalAdminHash.startsWith("$2"), "Admin password hash format is valid bcrypt ($2...)");

  // -------------------------------------------------------------
  // SECTION 2: Authentication Regression (DB + bcrypt, no HTTP session context)
  // -------------------------------------------------------------
  console.log("\n[SECTION 2: Authentication Regression]");
  const adminRow = await queryOne<{ admin_id: number; username: string; password: string; level: string }>(
    "SELECT admin_id, username, password, level FROM tb_admin WHERE username=$1",
    ["admin"]
  );
  assert(!!adminRow, "Admin row exists for credential check");

  const validPw = await verifyBcryptPassword("admin123", adminRow!.password);
  assert(validPw, "Correct password verifies against stored bcrypt hash");
  assert(adminRow!.level === "admin", "Admin level is 'admin'");

  const invalidPw = await verifyBcryptPassword("wrongpassword", adminRow!.password);
  assert(!invalidPw, "Invalid password rejected by bcrypt comparison");

  const noUser = await queryOne<{ admin_id: number }>("SELECT admin_id FROM tb_admin WHERE username=$1", ["nonexistent_user"]);
  assert(noUser === null, "Non-existent username yields no DB row (login would fail)");

  const directPwCheck = await verifyPassword("admin123", originalAdminHash);
  assert(directPwCheck, "Direct bcrypt verification (lib/admin) succeeds on original hash");

  const wrongDirect = await verifyPassword("wrongpassword", originalAdminHash);
  assert(!wrongDirect, "Wrong password correctly rejected (lib/admin)");

  // Session options verification
  const { sessionOptions } = await import("../lib/session");
  assert(sessionOptions.cookieName === "vlonix_session", "Session cookie name is 'vlonix_session'");
  assert(sessionOptions.cookieOptions?.httpOnly === true, "Session cookie has httpOnly enabled");
  assert(sessionOptions.cookieOptions?.sameSite === "lax", "Session cookie has sameSite='lax'");

  // -------------------------------------------------------------
  // SECTION 3: Products Full CRUD & Filtering
  // -------------------------------------------------------------
  console.log("\n[SECTION 3: Products Full CRUD & Filtering]");
  const categories = await listCategories();
  const firstCatId = categories[0].category_id;

  // CREATE
  const newProdId = await createProduct({
    category_id: firstCatId,
    product_name: "TEST_PHASE9_Item",
    product_price: 150000,
    product_description: "Automated regression product description.",
    product_image: "",
    product_status: 1,
  });
  assert(newProdId > 0, `Product CREATE succeeded (id=${newProdId})`);

  // READ
  const createdProd = await getProduct(newProdId);
  assert(createdProd !== null && createdProd.product_name === "TEST_PHASE9_Item", "Product READ returned matching record");
  assert(Number(createdProd?.product_price) === 150000, "Product price stored accurately");

  // UPDATE
  await updateProduct(newProdId, {
    category_id: firstCatId,
    product_name: "TEST_PHASE9_Item_Updated",
    product_price: 175000,
    product_description: "Updated description.",
    product_image: "",
    product_status: 1,
  });
  const updatedProd = await getProduct(newProdId);
  assert(updatedProd?.product_name === "TEST_PHASE9_Item_Updated", "Product UPDATE succeeded");
  assert(Number(updatedProd?.product_price) === 175000, "Product price updated accurately");

  // TOGGLE STATUS
  await toggleProductStatus(newProdId, 1);
  const inactiveProd = await getProduct(newProdId);
  assert(inactiveProd?.product_status === 0, "Product TOGGLE status from 1 to 0 (Inactive)");
  await toggleProductStatus(newProdId, 0);
  const activeProd = await getProduct(newProdId);
  assert(activeProd?.product_status === 1, "Product TOGGLE status back to 1 (Active)");

  // FILTER & SEARCH
  const searchResults = await listProducts({ q: "TEST_PHASE9" });
  assert(searchResults.some((p) => p.product_id === newProdId), "Search filter finds temporary item");

  const catFiltered = await listProducts({ categoryId: firstCatId });
  assert(catFiltered.some((p) => p.product_id === newProdId), "Category filter includes temporary item");

  const statusFiltered = await listProducts({ status: 1 });
  assert(statusFiltered.some((p) => p.product_id === newProdId), "Status filter includes active item");

  // DELETE
  await deleteProduct(newProdId);
  const deletedProd = await getProduct(newProdId);
  assert(deletedProd === null, "Product DELETE succeeded");

  // -------------------------------------------------------------
  // SECTION 4: Categories Regression
  // -------------------------------------------------------------
  console.log("\n[SECTION 4: Categories Regression]");
  const newCatId = await createCategory("TEST_PHASE9_Category");
  assert(newCatId > 0, `Category CREATE succeeded (id=${newCatId})`);

  const catList = await listCategories();
  assert(catList.some((c) => c.category_id === newCatId), "Category READ in list");

  await updateCategory(newCatId, "TEST_PHASE9_Category_Renamed");
  const catListRenamed = await listCategories();
  const renamedCat = catListRenamed.find((c) => c.category_id === newCatId);
  assert(renamedCat?.category_name === "TEST_PHASE9_Category_Renamed", "Category UPDATE succeeded");

  // FK constraint check: assign temporary product to category, then attempt delete
  const prodForCat = await createProduct({
    category_id: newCatId,
    product_name: "TEST_PHASE9_FK_Item",
    product_price: 50000,
    product_description: "FK test",
    product_image: "",
    product_status: 1,
  });

  let fkProtected = false;
  try {
    await deleteCategory(newCatId);
  } catch {
    fkProtected = true;
  }
  // If database enforces FK constraint or logic prevents delete
  assert(fkProtected || (await categoryExists(newCatId)), "Category with existing products cannot be deleted (FK safe)");

  // Clean up product and then delete category
  await deleteProduct(prodForCat);
  await deleteCategory(newCatId);
  assert(!(await categoryExists(newCatId)), "Category DELETE succeeded after removing dependent product");

  // -------------------------------------------------------------
  // SECTION 5: Messages & Public Contact Regression
  // -------------------------------------------------------------
  console.log("\n[SECTION 5: Messages & Public Contact Regression]");
  await submitContact(
    "TEST_PHASE9_Sender",
    "test_phase9@example.com",
    "This is an automated test message from Phase 9 verification suite."
  );

  const messages = await listMessages();
  const testMsg = messages.find((m) => m.name === "TEST_PHASE9_Sender");
  assert(testMsg !== undefined, "Contact submission stored message in tb_message");
  assert(messages[0].message_id >= (testMsg?.message_id ?? 0), "Messages listed newest-first");

  if (testMsg) {
    await deleteMessage(testMsg.message_id);
    assert(!(await messageExists(testMsg.message_id)), "Message DELETE succeeded");
  }

  // -------------------------------------------------------------
  // SECTION 6: Profile & Password Regression
  // -------------------------------------------------------------
  console.log("\n[SECTION 6: Profile & Password Regression]");
  const adminProfile = await getAdminById(1);
  assert(adminProfile !== null, "Admin profile READ succeeded");
  const origName = adminProfile?.admin_name || "";
  const origEmail = adminProfile?.admin_email || "";
  const origTelp = adminProfile?.admin_telp || "";
  const origAddr = adminProfile?.admin_address || "";

  // Temporary profile update
  await updateAdminProfile(1, {
    admin_name: origName,
    username: "admin",
    admin_telp: "089999999999",
    admin_email: origEmail,
    admin_address: origAddr,
  });
  const updatedAdminProf = await getAdminById(1);
  assert(updatedAdminProf?.admin_telp === "089999999999", "Admin profile UPDATE succeeded");

  // Restore exact original profile
  await updateAdminProfile(1, {
    admin_name: origName,
    username: "admin",
    admin_telp: origTelp,
    admin_email: origEmail,
    admin_address: origAddr,
    passwordHash: originalAdminHash,
  });
  const restoredAdminProf = await getAdminById(1);
  assert(restoredAdminProf?.admin_telp === origTelp, "Admin profile RESTORE succeeded");
  assert(restoredAdminProf?.password === originalAdminHash, "Admin password hash EXACTLY restored");

  // -------------------------------------------------------------
  // SECTION 7: Image & Storage Regression
  // -------------------------------------------------------------
  console.log("\n[SECTION 7: Image & Storage Regression]");
  const localProvider = new LocalStorageProvider();
  const legacyDir = path.join(process.cwd(), "..", "toko_kelontong", "uploads", "products");

  // Verify all 6 legacy seed images
  for (const imgName of Array.from(PROTECTED_SEED_IMAGES)) {
    const exists = await localProvider.exists(imgName);
    assert(exists, `Legacy image "${imgName}" accessible via LocalStorageProvider`);

    const stat = await fs.stat(path.join(legacyDir, imgName));
    assert(stat.size > 0, `Legacy file "${imgName}" exists and has size ${stat.size} bytes`);
  }

  // Deletion protection check
  await localProvider.delete("beras_pandan_wangi.png");
  assert(await localProvider.exists("beras_pandan_wangi.png"), "Protected seed image is NOT deleted by storage provider");

  // Magic bytes validation
  assert(detectImageMagicBytes(MINIMAL_PNG).detected, "PNG magic bytes detected");
  const fakePayload = Buffer.from("<?php echo 'hack'; ?>");
  assert(!detectImageMagicBytes(fakePayload).detected, "Invalid image buffer rejected");

  // Malicious script detection
  const maliciousImg = Buffer.concat([MINIMAL_PNG, Buffer.from("<?php system($_GET['c']); ?>")]);
  assert(hasSuspectScriptPayload(maliciousImg), "Suspect PHP script detected inside image payload");
  const maliciousVal = validateImage(maliciousImg, "test.png", "image/png");
  assert(!maliciousVal.valid, "Malicious image validation returns invalid");

  // Safe server-generated filename
  const genName = generateSafeFilename("png");
  assert(genName.startsWith("prod_") && genName.endsWith(".png"), "Server-side safe filename generated");
  assert(isValidSafeFilename(genName), "Generated filename is valid safe filename");
  assert(!isValidSafeFilename("../../etc/passwd.png"), "Path traversal filename rejected");

  // Local storage upload & cleanup cycle
  const testUploadName = generateSafeFilename("png");
  await localProvider.upload(MINIMAL_PNG, testUploadName);
  assert(await localProvider.exists(testUploadName), "Temporary upload created successfully");
  await localProvider.delete(testUploadName);
  assert(!(await localProvider.exists(testUploadName)), "Temporary upload deleted cleanly");

  // Storage provider abstraction test
  const blobProvider = new VercelBlobStorageProvider();
  assert(blobProvider.name === "vercel-blob" && blobProvider.isProductionReady, "VercelBlobStorageProvider configured as production-ready");
  assert(!localProvider.isProductionReady, "LocalStorageProvider explicitly marked as NOT production-ready");

  // -------------------------------------------------------------
  // SECTION 8: Storefront Regression
  // -------------------------------------------------------------
  console.log("\n[SECTION 8: Storefront Regression]");
  // Read actual product status distribution directly from tb_product (source of truth)
  const allDbProducts = await query<{ product_id: number; product_status: number }>(
    "SELECT product_id, product_status FROM tb_product ORDER BY product_id DESC"
  );
  const actualActiveCount = allDbProducts.filter((p) => p.product_status === 1).length;
  const actualInactiveCount = allDbProducts.filter((p) => p.product_status === 0).length;

  console.log(`- DB actual products total: ${allDbProducts.length}, active: ${actualActiveCount}, inactive: ${actualInactiveCount}`);

  const activeProducts = await getActiveProducts();
  assert(
    activeProducts.length === actualActiveCount,
    `Storefront returns exact count of active products (${actualActiveCount})`
  );
  assert(
    activeProducts.every((p) => p.product_status === 1),
    "Storefront only returns active products (product_status = 1)"
  );

  const totalActive = await getTotalActiveProducts();
  assert(
    totalActive === actualActiveCount,
    `getTotalActiveProducts() matches actual active products (${actualActiveCount})`
  );

  // Featured products must be exactly 3 (if active >= 3) and newest-first
  const featured = await getFeaturedProducts();
  assert(featured.length === Math.min(3, actualActiveCount), "Featured products returns exactly latest 3 items");
  if (featured.length >= 2) {
    assert(featured[0].product_id >= featured[1].product_id, "Featured products sorted newest first");
  }

  // Inactive products are confirmed hidden from storefront
  const activeIds = new Set(activeProducts.map((p) => p.product_id));
  const inactiveHidden = allDbProducts
    .filter((p) => p.product_status === 0)
    .every((p) => !activeIds.has(p.product_id));
  assert(
    inactiveHidden,
    `All inactive products (${actualInactiveCount}) are hidden from storefront`
  );

  // -------------------------------------------------------------
  // SECTION 9: Final Read-Only Database Verification
  // -------------------------------------------------------------
  console.log("\n[SECTION 9: Final Read-Only Database Verification]");
  const [finalAdminC, finalCatC, finalProdC, finalMsgC] = await Promise.all([
    queryScalar<number>("SELECT COUNT(*) FROM tb_admin;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_category;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_product;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_message;"),
  ]);

  console.log(`- tb_admin: ${finalAdminC} (expected: 1)`);
  console.log(`- tb_category: ${finalCatC} (expected: 5)`);
  console.log(`- tb_product: ${finalProdC} (expected: 6)`);
  console.log(`- tb_message: ${finalMsgC} (expected: 3)`);

  assert(Number(finalAdminC) === 1, "Final check: tb_admin = 1");
  assert(Number(finalCatC) === 5, "Final check: tb_category = 5");
  assert(Number(finalProdC) === 6, "Final check: tb_product = 6");
  assert(Number(finalMsgC) === 3, "Final check: tb_message = 3");

  const finalAdmin = await queryOne<{ password: string }>("SELECT password FROM tb_admin WHERE username='admin'");
  assert(finalAdmin?.password === originalAdminHash, "Final check: Admin password hash exactly matches original");

  console.log("\n=================================================================");
  console.log(`   ALL PHASE 9 REGRESSION TESTS PASSED (${passCount}/${totalCount} assertions) `);
  console.log("=================================================================\n");

  await closePool();
}

main().catch(async (err) => {
  console.error("Regression test suite failed:", err);
  await closePool();
  process.exit(1);
});
