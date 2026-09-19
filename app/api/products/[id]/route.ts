// app/api/products/[id]/route.ts — PUT update, DELETE
import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { updateProduct, deleteProduct, getProduct } from "@/lib/products";
import { categoryExists } from "@/lib/categories";
import { isValidSafeFilename, PROTECTED_SEED_IMAGES } from "@/lib/image-validation";
import { getStorageProvider } from "@/lib/storage";

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = await resolveId(params);
  if (!productId) return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  const existing = await getProduct(productId);
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  try {
    const body = await req.json();
    const { product_name, category_id, product_price, product_description, product_image, product_status } = body;

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

    // Validate image filename safety (if supplied)
    const newImage = typeof product_image === "string" ? product_image.trim() : existing.product_image;
    if (newImage !== "" && !isValidSafeFilename(newImage)) {
      return NextResponse.json({ error: "Invalid image reference format." }, { status: 400 });
    }

    await updateProduct(productId, {
      category_id: Number(category_id),
      product_name: product_name.trim(),
      product_price: price,
      product_description: typeof product_description === "string" ? product_description.trim() : "",
      product_image: newImage,
      product_status: status as 0 | 1,
    });

    // Safe replacement behavior: clean up old file only after DB update succeeds,
    // and never delete original seed images.
    const oldImage = existing.product_image;
    if (oldImage && oldImage !== newImage && !PROTECTED_SEED_IMAGES.has(oldImage)) {
      await getStorageProvider().delete(oldImage);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = await resolveId(params);
  if (!productId) return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  const existing = await getProduct(productId);
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  try {
    await deleteProduct(productId);

    // Clean up product image if not a protected seed image
    if (existing.product_image && !PROTECTED_SEED_IMAGES.has(existing.product_image)) {
      await getStorageProvider().delete(existing.product_image);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
}
