import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn, getAdminIdFromSession } from "@/lib/auth";
import { getAdminById, verifyPassword, hashPassword, updateAdminProfile } from "@/lib/admin";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (new_password.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (current_password === new_password) {
      return NextResponse.json({ error: "New password must be different from current password." }, { status: 400 });
    }

    const sessionAdminId = await getAdminIdFromSession();
    if (!sessionAdminId) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const admin = await getAdminById(sessionAdminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }
    if (!(await verifyPassword(current_password, admin.password))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const newHash = await hashPassword(new_password);
    await updateAdminProfile(sessionAdminId, {
      admin_name: admin.admin_name,
      username: admin.username,
      admin_telp: admin.admin_telp,
      admin_email: admin.admin_email,
      admin_address: admin.admin_address,
      passwordHash: newHash,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password change error:", err);
    return NextResponse.json({ error: "Password change failed." }, { status: 500 });
  }
}
