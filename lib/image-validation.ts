// lib/image-validation.ts — server-side only
import crypto from "crypto";
import path from "path";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const PROTECTED_SEED_IMAGES = new Set([
  "beras_pandan_wangi.png",
  "minyak_sawit_2l.png",
  "kopi_toraja.png",
  "biskuit_gandum.png",
  "sabun_cuci_piring.png",
  "gula_pasir_1kg.png",
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  extension?: AllowedExtension;
  mimeType?: string;
}

/**
 * Verify image binary magic bytes
 */
export function detectImageMagicBytes(buffer: Buffer): {
  detected: boolean;
  extension?: AllowedExtension;
  mimeType?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { detected: false };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { detected: true, extension: "png", mimeType: "image/png" };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { detected: true, extension: "jpg", mimeType: "image/jpeg" };
  }

  // GIF: 47 49 46 38 (37|39) 61 -> GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { detected: true, extension: "gif", mimeType: "image/gif" };
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { detected: true, extension: "webp", mimeType: "image/webp" };
  }

  return { detected: false };
}

/**
 * Scan for suspect scripts / executable payload inside image buffer
 */
export function hasSuspectScriptPayload(buffer: Buffer): boolean {
  // Convert first 4KB and last 4KB to string to scan for script patterns
  const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1");
  const tail = buffer.subarray(Math.max(0, buffer.length - 4096)).toString("latin1");
  const sample = head + " " + tail;

  const suspectRegex = /<\?(php|=)|<script\b|eval\s*\(|base64_decode|system\s*\(|passthru\s*\(/i;
  return suspectRegex.test(sample);
}

/**
 * Validate image buffer, size, extension, MIME, magic bytes, and content
 */
export function validateImage(
  buffer: Buffer,
  originalFilename: string,
  declaredMimeType?: string
): ValidationResult {
  // 1. Size check
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty file received." };
  }
  if (buffer.length > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Image size must not exceed 5 MB." };
  }

  // 2. Extension check from original filename
  const rawExt = path.extname(originalFilename || "").toLowerCase().replace(/^\./, "");
  const normalizedExt = rawExt === "jpeg" ? "jpg" : rawExt;

  if (!ALLOWED_EXTENSIONS.includes(normalizedExt as AllowedExtension)) {
    return {
      valid: false,
      error: "Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF.",
    };
  }

  // 3. MIME type check if provided
  if (declaredMimeType) {
    const isAllowedMime = ALLOWED_MIME_TYPES.some((m) =>
      declaredMimeType.toLowerCase().startsWith(m)
    );
    if (!isAllowedMime) {
      return { valid: false, error: "Invalid image MIME type." };
    }
  }

  // 4. Magic bytes verification (content inspection, not just header)
  const magic = detectImageMagicBytes(buffer);
  if (!magic.detected) {
    return {
      valid: false,
      error: "File content is not a valid image.",
    };
  }

  // 5. Script / executable inspection
  if (hasSuspectScriptPayload(buffer)) {
    return {
      valid: false,
      error: "Suspect file rejected for security reasons.",
    };
  }

  return {
    valid: true,
    extension: magic.extension === "jpeg" ? "jpg" : magic.extension,
    mimeType: magic.mimeType,
  };
}

/**
 * Generate a cryptographically secure, random server-side filename.
 * Never uses the user's client-supplied filename for the storage path!
 */
export function generateSafeFilename(extension: AllowedExtension): string {
  const randomHex = crypto.randomBytes(8).toString("hex");
  return `prod_${randomHex}.${extension === "jpeg" ? "jpg" : extension}`;
}

/**
 * Check if a filename is a safe alphanumeric filename without path traversal
 */
export function isValidSafeFilename(filename: string): boolean {
  if (!filename || typeof filename !== "string") return false;
  // Must be clean basename with allowed extension, no slashes or dots traversal
  const basename = path.basename(filename);
  if (basename !== filename) return false;
  return /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
}
