import { NextRequest, NextResponse } from "next/server";
import { loginAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 400 }
      );
    }

    const result = await loginAdmin(username.trim(), password);

    if (!result.success || !result.admin) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        adminId: result.admin.adminId,
        adminName: result.admin.adminName,
        username: result.admin.username,
        adminEmail: result.admin.adminEmail,
        level: result.admin.level,
      },
    });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 500 }
    );
  }
}
