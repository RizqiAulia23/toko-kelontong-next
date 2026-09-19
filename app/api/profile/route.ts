import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn, getAdminIdFromSession } from "@/lib/auth";
import { updateAdminProfile } from "@/lib/admin";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionAdminId = await getAdminIdFromSession();
  if (!sessionAdminId) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { admin_name, username, admin_telp, admin_email, admin_address } = body;

    if (!admin_name || typeof admin_name !== "string" || admin_name.trim().length === 0) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    const telp = typeof admin_telp === "string" ? admin_telp.trim() : "";
    const email = typeof admin_email === "string" ? admin_email.trim().toLowerCase() : "";
    const address = typeof admin_address === "string" ? admin_address.trim() : "";

    await updateAdminProfile(sessionAdminId, {
      admin_name: admin_name.trim(),
      username: username.trim(),
      admin_telp: telp,
      admin_email: email,
      admin_address: address,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Profile update failed." }, { status: 500 });
  }
}
