// scripts/verify-phase8.ts
// Phase 8 Automated Verification: Image Handling, Secure Upload, Storage Abstraction, DB Integrity
import fs from "fs/promises";
import path from "path";
import {
  MAX_IMAGE_SIZE,
  PROTECTED_SEED_IMAGES,
  detectImageMagicBytes,
  validateImage,
  generateSafeFilename,
  isValidSafeFilename,
} from "../lib/image-validation";
import {
  LocalStorageProvider,
  VercelBlobStorageProvider,
} from "../lib/storage";
import { queryScalar, queryOne, closePool } from "../lib/db";

const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

async function main() {
  console.log("=== Phase 8 Verification Test Suite ===");
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      process.exit(1);
    }
    console.log(`✅ PASS: ${msg}`);
    passedTests++;
  }

  // 1. Magic bytes
  const pngMagic = detectImageMagicBytes(MINIMAL_PNG);
  assert(pngMagic.detected && pngMagic.extension === "png", "Detects valid PNG magic bytes");

  // 2. Validation
  const validRes = validateImage(MINIMAL_PNG, "test.png", "image/png");
  assert(validRes.valid && validRes.extension === "png", "Validates legitimate PNG file");

  const oversizedBuffer = Buffer.alloc(MAX_IMAGE_SIZE + 1024, 0x89);
  const oversizedRes = validateImage(oversizedBuffer, "large.png", "image/png");
  assert(!oversizedRes.valid, "Rejects image exceeding 5 MB limit");

  // 3. Filename
  const name1 = generateSafeFilename("png");
  assert(name1.startsWith("prod_") && name1.endsWith(".png"), "Safe filename matches format");
  assert(isValidSafeFilename("prod_abc123.jpg"), "Validates clean safe filename");
  assert(!isValidSafeFilename("../../../etc/passwd.png"), "Rejects directory traversal in filename");

  // 4. Storage Abstraction
  const localProvider = new LocalStorageProvider();
  assert(!localProvider.isProductionReady, "LocalStorageProvider is NOT production ready (local only)");

  const vercelProvider = new VercelBlobStorageProvider();
  assert(vercelProvider.isProductionReady, "VercelBlobStorageProvider is marked as production-ready abstraction");

  // 5. Legacy Seed Images
  const legacyDir = path.join(process.cwd(), "..", "toko_kelontong", "uploads", "products");
  for (const filename of Array.from(PROTECTED_SEED_IMAGES)) {
    const exists = await localProvider.exists(filename);
    assert(exists, `Legacy seed image "${filename}" is readable`);
    const stat = await fs.stat(path.join(legacyDir, filename));
    assert(stat.size > 0, `Legacy file "${filename}" exists and is non-empty`);
  }

  // 6. DB Integrity
  const [adminCount, catCount, prodCount, msgCount] = await Promise.all([
    queryScalar<number>("SELECT COUNT(*) FROM tb_admin;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_category;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_product;"),
    queryScalar<number>("SELECT COUNT(*) FROM tb_message;"),
  ]);

  assert(Number(adminCount) === 1, "tb_admin count is 1");
  assert(Number(catCount) === 5, "tb_category count is 5");
  assert(Number(prodCount) === 6, "tb_product count is 6");
  assert(Number(msgCount) === 3, "tb_message count is 3");

  const admin = await queryOne<{ password: string }>("SELECT password FROM tb_admin WHERE username = 'admin'");
  assert(!!admin?.password?.startsWith("$2"), "Admin password hash is intact and unchanged");

  console.log(`\nALL PHASE 8 VERIFICATIONS PASSED (${passedTests}/${totalTests} tests)`);
  await closePool();
}

main().catch(async (err) => {
  console.error("Verification failed:", err);
  await closePool();
  process.exit(1);
});
