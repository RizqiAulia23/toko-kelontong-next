// app/uploads/products/[filename]/route.ts
// Serves product images for local development and redirects to Vercel Blob in production:
// primary: Next.js public/uploads/products → fallback: legacy PHP uploads.
// Hardens filename against path traversal, arbitrary extensions, and non-image content.
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { isValidSafeFilename } from "@/lib/image-validation";
import { localStorageProvider, getStorageProvider } from "@/lib/storage";
import { head } from "@vercel/blob";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // 1) Reject invalid / traversal filenames
    if (!isValidSafeFilename(filename)) {
      return new NextResponse("Invalid image filename.", { status: 400 });
    }

    const safe = path.basename(filename);
    const provider = getStorageProvider();

    // In production with vercel-blob:
    if (provider.name === "vercel-blob") {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (token) {
        try {
          const blobInfo = await head(`products/${safe}`, { token });
          if (blobInfo && blobInfo.url) {
            return NextResponse.redirect(blobInfo.url, 307);
          }
        } catch {
          // Fall through to local/legacy fallback if blob head fails
        }
      }
    }

    const record = await localStorageProvider.read(safe);

    if (!record) {
      return new NextResponse(null, { status: 404 });
    }

    const ext = safe.split(".").pop()?.toLowerCase() ?? "png";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    const mime = mimeMap[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(record.data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
