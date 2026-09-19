import { queryOne, closePool } from "../lib/db";
import { getAdminById, verifyPassword, hashPassword, updateAdminProfile } from "../lib/admin";

async function main() {
  console.log("=== Phase 6 Verification Test ===");

  // 1. Read existing profile
  const admin = await getAdminById(1);
  if (!admin) {
    console.error("❌ Admin #1 not found");
    process.exit(1);
  }
  console.log("✅ Profile READ:", admin.admin_name, admin.admin_email);

  // Record original values for exact restore
  const originalTelp = admin.admin_telp;
  const originalAddress = admin.admin_address;
  const originalHash = admin.password;

  // 2. Profile update test (temporarily change telp)
  await updateAdminProfile(1, {
    admin_name: admin.admin_name,
    username: admin.username,
    admin_telp: "+62 800-0000-0000",
    admin_email: admin.admin_email,
    admin_address: admin.admin_address,
  });

  const updatedAdmin = await getAdminById(1);
  if (updatedAdmin?.admin_telp !== "+62 800-0000-0000") {
    console.error("❌ Profile update failed");
    process.exit(1);
  }
  console.log("✅ Profile UPDATE successful");

  // Restore exact original profile
  await updateAdminProfile(1, {
    admin_name: admin.admin_name,
    username: admin.username,
    admin_telp: originalTelp,
    admin_email: admin.admin_email,
    admin_address: originalAddress,
  });
  console.log("✅ Profile RESTORE successful");

  // 3. Password Verification Tests
  // Wrong current password
  const wrongMatch = await verifyPassword("wrong_password_123", originalHash);
  if (wrongMatch) {
    console.error("❌ Wrong password check failed!");
    process.exit(1);
  }
  console.log("✅ Wrong password rejected");

  // Valid password check
  const validMatch = await verifyPassword("admin123", originalHash);
  if (!validMatch) {
    console.error("❌ Correct password check failed!");
    process.exit(1);
  }
  console.log("✅ Correct password verified");

  // Test password change and restore
  const tempHash = await hashPassword("new_test_password_888");
  await updateAdminProfile(1, {
    admin_name: admin.admin_name,
    username: admin.username,
    admin_telp: originalTelp,
    admin_email: admin.admin_email,
    admin_address: originalAddress,
    passwordHash: tempHash,
  });
  console.log("✅ Password changed to temporary test password");

  // Restore original password hash directly
  await updateAdminProfile(1, {
    admin_name: admin.admin_name,
    username: admin.username,
    admin_telp: originalTelp,
    admin_email: admin.admin_email,
    admin_address: originalAddress,
    passwordHash: originalHash,
  });

  const restoredAdmin = await getAdminById(1);
  if (restoredAdmin?.password !== originalHash) {
    console.error("❌ Original password hash NOT restored correctly!");
    process.exit(1);
  }
  console.log("✅ Original password hash RESTORED EXACTLY");

  // Database Integrity Check
  const [adminCount, catCount, prodCount, msgCount] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM tb_admin"),
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM tb_category"),
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM tb_product"),
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM tb_message"),
  ]);

  console.log("\nDatabase Integrity Counts:");
  console.log(`- tb_admin: ${adminCount?.count} (expected: 1)`);
  console.log(`- tb_category: ${catCount?.count} (expected: 5)`);
  console.log(`- tb_product: ${prodCount?.count} (expected: 6)`);
  console.log(`- tb_message: ${msgCount?.count} (expected: 3)`);

  if (
    adminCount?.count !== "1" ||
    catCount?.count !== "5" ||
    prodCount?.count !== "6" ||
    msgCount?.count !== "3"
  ) {
    console.error("❌ Integrity check failed!");
    process.exit(1);
  }
  console.log("✅ Integrity check passed: all tables unchanged!");

  await closePool();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
