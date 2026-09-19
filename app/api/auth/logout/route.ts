import { NextResponse } from "next/server";
import { logoutAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await logoutAdmin();
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout API error:", err);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
