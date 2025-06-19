import {
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  FileValidationError,
} from "@/types/file";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Validates a file based on size and type constraints
 * Note: This only validates the claimed file size - actual streaming validation happens in saveFile()
 */
export function validateFile(file: File): FileValidationError | null {
  // Check claimed file size (first line of defense)
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: "size",
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`,
      filename: file.name,
    };
  }

  // Check file type
  if (
    !SUPPORTED_FILE_TYPES.includes(
      file.type as (typeof SUPPORTED_FILE_TYPES)[number],
    )
  ) {
    return {
      type: "type",
      message: `File type "${file.type}" is not supported`,
      filename: file.name,
    };
  }

  return null;
}

/**
 * Server-side validation that actually streams and validates file content
 */
export async function validateFileStream(
  file: File,
): Promise<FileValidationError | null> {
  // First do basic validation
  const basicValidation = validateFile(file);
  if (basicValidation) {
    return basicValidation;
  }

  // Then validate actual file size by streaming
  const sizeValidation = await validateFileSize(file);

  if (!sizeValidation.valid) {
    return {
      type: "size",
      message: sizeValidation.error || "File size validation failed",
      filename: file.name,
    };
  }

  // Verify that claimed size matches actual size (detect spoofing)
  if (Math.abs(file.size - sizeValidation.actualSize) > 1024) {
    // Allow 1KB tolerance for headers/metadata
    return {
      type: "size",
      message: `File size mismatch detected. Claimed: ${formatFileSize(file.size)}, Actual: ${formatFileSize(sizeValidation.actualSize)}. This may indicate file header spoofing.`,
      filename: file.name,
    };
  }

  return null;
}

/**
 * Generates a unique filename while preserving the original extension
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const uuid = randomUUID();
  return `${uuid}${ext}`;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Ensures the upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validates file size by streaming and counting bytes to prevent spoofing
 */
async function validateFileSize(
  file: File,
): Promise<{ valid: boolean; actualSize: number; error?: string }> {
  const stream = file.stream();
  const reader = stream.getReader();
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      bytesRead += value.length;

      // Check if we've exceeded the limit during streaming
      if (bytesRead > MAX_FILE_SIZE) {
        await reader.cancel();
        return {
          valid: false,
          actualSize: bytesRead,
          error: `File size exceeds maximum allowed (${formatFileSize(MAX_FILE_SIZE)}). Upload terminated at ${formatFileSize(bytesRead)}.`,
        };
      }
    }

    return { valid: true, actualSize: bytesRead };
  } catch (error) {
    console.error("Error validating file size:", error);
    return {
      valid: false,
      actualSize: bytesRead,
      error: "Failed to validate file size",
    };
  } finally {
    reader.releaseLock();
  }
}

/**
 * Saves a file to the upload directory with stream validation
 */
export async function saveFile(file: File, filename: string): Promise<string> {
  await ensureUploadDir();

  // First, validate the actual file size by streaming
  const sizeValidation = await validateFileSize(file);

  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error || "File size validation failed");
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  // Stream the file to disk with size monitoring
  const stream = file.stream();
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.length;

      // Double-check size limit during save (defense in depth)
      if (totalBytes > MAX_FILE_SIZE) {
        throw new Error(
          `File size limit exceeded during save: ${formatFileSize(totalBytes)} > ${formatFileSize(MAX_FILE_SIZE)}`,
        );
      }

      chunks.push(value);
    }

    // Combine all chunks and write to file
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    await fs.writeFile(filePath, Buffer.from(buffer));

    return filePath;
  } catch (error) {
    // Clean up partial file if it exists
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Deletes a file from the upload directory
 */
export async function deleteFile(filename: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    await fs.unlink(filePath);
  } catch (deleteError) {
    // File might not exist, which is fine
    console.warn(`Failed to delete file ${filename}:`, deleteError);
  }
}

/**
 * Gets the public URL for a file
 */
export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

/**
 * Extracts file type category from MIME type
 */
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return "spreadsheet";
  if (mimeType.startsWith("text/")) return "text";

  return "other";
}
