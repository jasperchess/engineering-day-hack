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
 */
export function validateFile(file: File): FileValidationError | null {
  // Check file size
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
 * Saves a file to the upload directory
 */
export async function saveFile(file: File, filename: string): Promise<string> {
  await ensureUploadDir();

  const filePath = path.join(UPLOAD_DIR, filename);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.writeFile(filePath, buffer);

  return filePath;
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
