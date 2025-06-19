import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/utils/fileUtils";

// GET /uploads/[filename] - Serve uploaded files
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } },
) {
  try {
    const { filename } = params;

    if (!filename) {
      return new NextResponse("Filename is required", { status: 400 });
    }

    // Security check: prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, sanitizedFilename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";

    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }

    // Create response with appropriate headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Disposition": `inline; filename="${sanitizedFilename}"`,
      },
    });

    return response;
  } catch (error) {
    console.error("File serving error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
