import { NextResponse } from "next/server";
import { getCurrentAdmin, isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentAdmin();
  const loggedIn = await isAdminLoggedIn();

  return NextResponse.json({
    loggedIn,
    admin: loggedIn ? {
      id: admin!.adminId,
      username: admin!.username,
      name: admin!.adminName,
      level: admin!.level,
    } : null,
  });
}
