import { NextRequest, NextResponse } from "next/server";
import { MAX_FILE_SIZE } from "@/types/file";

/**
 * Middleware to validate file upload size before processing
 * This provides an early defense against oversized uploads
 */
export async function validateUploadSize(request: NextRequest): Promise<NextResponse | null> {
  // Only apply to file upload endpoints
  const isFileUpload = request.url.includes('/api/files') && request.method === 'POST';

  if (!isFileUpload) {
    return null; // Continue to next middleware
  }

  // Check Content-Length header if present
  const contentLength = request.headers.get('content-length');

  if (contentLength) {
    const size = parseInt(contentLength, 10);

    if (isNaN(size)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Content-Length header"
        },
        { status: 400 }
      );
    }

    // Add some buffer for form data overhead (multipart boundaries, headers, etc.)
    // FormData typically adds 200-500 bytes of overhead
    const maxAllowedSize = MAX_FILE_SIZE + 1024; // 1KB buffer

    if (size > maxAllowedSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Request size (${formatBytes(size)}) exceeds maximum allowed (${formatBytes(MAX_FILE_SIZE)})`
        },
        {
          status: 413, // Payload Too Large
          headers: {
            'Connection': 'close', // Close connection to prevent further data
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  // For requests without Content-Length, we'll let the stream validation handle it
  // This can happen with chunked transfer encoding
  return null; // Continue to next middleware
}

/**
 * Middleware wrapper that can be used to abort large uploads early
 */
export function createUploadSizeGuard() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      return await validateUploadSize(request);
    } catch (error) {
      console.error('Upload size validation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: "Upload validation failed"
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Additional security headers for file upload endpoints
 */
export function getUploadSecurityHeaders(): Record<string, string> {
  return {
    // Prevent the browser from MIME-sniffing
    'X-Content-Type-Options': 'nosniff',
    // Prevent caching of upload responses
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    // Security headers
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
}
