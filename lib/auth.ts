// lib/auth.ts
// Authentication layer for VLONIX
// Server-side only. Never import from Client Components.

import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { queryOne } from "./db";
import { SessionData, sessionOptions } from "./session";
import { redirect } from "next/navigation";

export interface AdminRow {
  admin_id: number;
  admin_name: string;
  username: string;
  password: string;
  admin_telp: string;
  admin_email: string;
  admin_address: string;
  level: string;
}

// 1. Get iron session directly using next/headers cookies()
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// 2. Login function
export async function loginAdmin(
  username: string,
  password: string
): Promise<{ success: boolean; admin?: SessionData; error?: string }> {
  try {
    // 1. Find admin by username
    const admin = await queryOne<AdminRow>(
      "SELECT * FROM tb_admin WHERE username = $1 LIMIT 1",
      [username]
    );

    if (!admin) {
      return { success: false, error: "Invalid username or password." };
    }

    // 2. Verify password using bcrypt (supports $2y$ format)
    const isPasswordValid = await verifyBcryptPassword(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return { success: false, error: "Invalid username or password." };
    }

    // 3. Verify admin level
    if (admin.level !== "admin") {
      return { success: false, error: "Access restricted to administrators." };
    }

    // 4. Create session data (DO NOT include password)
    const sessionData: SessionData = {
      adminId: admin.admin_id,
      adminName: admin.admin_name,
      username: admin.username,
      adminEmail: admin.admin_email,
      level: admin.level as "admin" | "pelanggan",
    };

    // 5. Set session
    const session = await getSession();
    Object.assign(session, sessionData);
    await session.save();

    return { success: true, admin: sessionData };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }
}

// 3. Password verification - compatible with PHP's $2y$ bcrypt hashes
export async function verifyBcryptPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // bcryptjs supports $2y$ format directly
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// 4. Generate bcrypt hash (for Phase 4+ when creating new admin if needed)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// 5. Get current session admin
export async function getCurrentAdmin(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session || !session.adminId || !session.username || !session.level) {
    return null;
  }
  return session as SessionData;
}

// 5b. Get admin_id from current session
export async function getAdminIdFromSession(): Promise<number | null> {
  const session = await getSession();
  return session?.adminId ?? null;
}

// 6. Check if admin is logged in
export async function isAdminLoggedIn(): Promise<boolean> {
  const session = await getSession();
  return (
    session !== null &&
    session.adminId !== undefined &&
    session.username !== undefined &&
    session.level === "admin"
  );
}

// 7. Require admin guard - call this at the start of protected routes
export async function requireAdmin(): Promise<SessionData> {
  const session = await getCurrentAdmin();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.level !== "admin") {
    redirect("/admin/login");
  }

  return session;
}

// 8. Logout function
export async function logoutAdmin(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

// 9. Session regeneration (iron-session handles this on save())
export async function regenerateSession(): Promise<void> {
  const session = await getSession();
  await session.save();
}

// 10. Export for type safety
export type { SessionData };
