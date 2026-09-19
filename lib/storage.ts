// lib/storage.ts — server-side storage abstraction
import fs from "fs/promises";
import path from "path";
import { put, del, head } from "@vercel/blob";
import { PROTECTED_SEED_IMAGES, isValidSafeFilename } from "./image-validation";

export interface StorageProvider {
  name: string;
  isProductionReady: boolean;
  upload(buffer: Buffer, filename: string, mimeType?: string): Promise<string>;
  delete(filename: string): Promise<void>;
  getUrl(filename: string): string;
  exists(filename: string): Promise<boolean>;
}

/**
 * Local Storage Provider for development and local compatibility
 */
export class LocalStorageProvider implements StorageProvider {
  name = "local";
  isProductionReady = false;

  private primaryDir = path.join(process.cwd(), "public", "uploads", "products");
  private legacyFallbackDir = path.join(process.cwd(), "..", "toko_kelontong", "uploads", "products");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(buffer: Buffer, filename: string, mimeType?: string): Promise<string> {
    if (!isValidSafeFilename(filename)) {
      throw new Error("Unsafe filename detected.");
    }

    await fs.mkdir(this.primaryDir, { recursive: true });
    const targetPath = path.join(this.primaryDir, path.basename(filename));
    await fs.writeFile(targetPath, buffer);
    return filename;
  }

  async delete(filename: string): Promise<void> {
    if (!filename || !isValidSafeFilename(filename)) return;

    // Never delete protected seed images
    if (PROTECTED_SEED_IMAGES.has(filename)) {
      return;
    }

    const targetPath = path.join(this.primaryDir, path.basename(filename));
    try {
      await fs.unlink(targetPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  getUrl(filename: string): string {
    if (!filename) return "";
    return `/uploads/products/${encodeURIComponent(path.basename(filename))}`;
  }

  async exists(filename: string): Promise<boolean> {
    if (!filename || !isValidSafeFilename(filename)) return false;

    // Check primary local dir
    try {
      await fs.access(path.join(this.primaryDir, path.basename(filename)));
      return true;
    } catch {
      // Check legacy fallback dir
      try {
        await fs.access(path.join(this.legacyFallbackDir, path.basename(filename)));
        return true;
      } catch {
        return false;
      }
    }
  }

  async read(filename: string): Promise<{ data: Buffer; source: string } | null> {
    if (!filename || !isValidSafeFilename(filename)) return null;

    const safeName = path.basename(filename);

    // 1. Try Next.js public uploads
    try {
      const p = path.join(this.primaryDir, safeName);
      const data = await fs.readFile(p);
      return { data, source: "primary" };
    } catch {
      // 2. Fallback to PHP legacy uploads
      try {
        const p = path.join(this.legacyFallbackDir, safeName);
        const data = await fs.readFile(p);
        return { data, source: "legacy" };
      } catch {
        return null;
      }
    }
  }
}

/**
 * Object Storage Provider for production using @vercel/blob
 */
export class VercelBlobStorageProvider implements StorageProvider {
  name = "vercel-blob";
  isProductionReady = true;

  private token = process.env.BLOB_READ_WRITE_TOKEN;

  async upload(buffer: Buffer, filename: string, mimeType?: string): Promise<string> {
    if (!this.token) {
      throw new Error(
        "Production storage is not configured. Missing BLOB_READ_WRITE_TOKEN environment variable."
      );
    }
    if (!isValidSafeFilename(filename)) {
      throw new Error("Unsafe filename detected.");
    }

    const safe = path.basename(filename);
    await put(`products/${safe}`, buffer, {
      access: "public",
      token: this.token,
      contentType: mimeType || "image/png",
      addRandomSuffix: false,
    });

    return safe;
  }

  async delete(filename: string): Promise<void> {
    if (!this.token || !filename || !isValidSafeFilename(filename) || PROTECTED_SEED_IMAGES.has(filename)) {
      return;
    }
    const safe = path.basename(filename);
    try {
      await del(`products/${safe}`, { token: this.token });
    } catch {
      // Ignore if not found on blob
    }
  }

  getUrl(filename: string): string {
    if (!filename) return "";
    return `/uploads/products/${encodeURIComponent(path.basename(filename))}`;
  }

  async exists(filename: string): Promise<boolean> {
    if (!this.token || !filename || !isValidSafeFilename(filename)) return false;
    const safe = path.basename(filename);
    try {
      const info = await head(`products/${safe}`, { token: this.token });
      return !!info;
    } catch {
      return false;
    }
  }
}

/**
 * Storage Provider Factory
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();

  if (provider === "vercel-blob") {
    return new VercelBlobStorageProvider();
  }

  // Default to LocalStorageProvider with legacy compatibility for development
  return new LocalStorageProvider();
}

export const localStorageProvider = new LocalStorageProvider();
