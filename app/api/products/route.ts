// app/api/products/route.ts — POST create product
import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { createProduct } from "@/lib/products";
import { categoryExists } from "@/lib/categories";
import { isValidSafeFilename } from "@/lib/image-validation";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { product_name, category_id, product_price, product_description, product_image, product_status } = body;

    // Validate
    if (!product_name || typeof product_name !== "string" || product_name.trim().length === 0) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (product_name.trim().length > 150) {
      return NextResponse.json({ error: "Product name cannot exceed 150 characters." }, { status: 400 });
    }
    if (!category_id || isNaN(Number(category_id)) || Number(category_id) <= 0) {
      return NextResponse.json({ error: "Please select a valid category." }, { status: 400 });
    }
    if (!(await categoryExists(Number(category_id)))) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }
    const price = parseFloat(product_price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
    }
    const status = product_status === 0 || product_status === 1 ? product_status : 1;

    const safeImage = typeof product_image === "string" ? product_image.trim() : "";
    if (safeImage !== "" && !isValidSafeFilename(safeImage)) {
      return NextResponse.json({ error: "Invalid image reference format." }, { status: 400 });
    }

    const id = await createProduct({
      category_id: Number(category_id),
      product_name: product_name.trim(),
      product_price: price,
      product_description: typeof product_description === "string" ? product_description.trim() : "",
      product_image: safeImage,
      product_status: status as 0 | 1,
    });

    return NextResponse.json({ success: true, product_id: id });
  } catch (err) {
    console.error("Create product error:", err);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
