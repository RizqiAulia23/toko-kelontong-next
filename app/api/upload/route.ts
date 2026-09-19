// app/api/upload/route.ts — Secure image upload endpoint
import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { validateImage, generateSafeFilename } from "@/lib/image-validation";
import { getStorageProvider } from "@/lib/storage";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const originalName = "name" in file && typeof file.name === "string" ? file.name : "upload.png";
    const declaredMime = file.type || undefined;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Validate image content, magic bytes, extension, size, and scripts
    const validation = validateImage(buffer, originalName, declaredMime);
    if (!validation.valid || !validation.extension || !validation.mimeType) {
      return NextResponse.json(
        { error: validation.error || "Image validation failed." },
        { status: 400 }
      );
    }

    // 2. Cryptographically generate safe server-side random filename
    // Client-supplied filename is NEVER used as the storage path!
    const safeFilename = generateSafeFilename(validation.extension);

    // 3. Store via active storage provider (local development or production object storage)
    const storage = getStorageProvider();
    await storage.upload(buffer, safeFilename, validation.mimeType);

    return NextResponse.json({
      success: true,
      filename: safeFilename,
      url: storage.getUrl(safeFilename),
    });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
