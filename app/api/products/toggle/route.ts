// app/api/products/toggle/route.ts — POST toggle status
import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { toggleProductStatus, productExists } from "@/lib/products";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, currentStatus } = body;

    const id = parseInt(String(productId), 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
    }
    if (!(await productExists(id))) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    if (currentStatus !== 0 && currentStatus !== 1) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    await toggleProductStatus(id, currentStatus as 0 | 1);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Toggle status error:", err);
    return NextResponse.json({ error: "Failed to toggle status." }, { status: 500 });
  }
}
