import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files } from "@/app/auth/schema";
import { eq } from "drizzle-orm";
import { FileItem } from "@/types/file";

// GET /api/files/[id] - Get a single file by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 },
      );
    }

    // Get file from database
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 },
      );
    }

    const fileItem: FileItem = {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      mimeType: file.mimeType,
      uploadDate: file.uploadDate,
      uploadedBy: file.uploadedBy,
      url: file.url,
      thumbnailUrl: file.thumbnailUrl,
    };

    return NextResponse.json({
      success: true,
      file: fileItem,
    });
  } catch (error) {
    console.error("File fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch file" },
      { status: 500 },
    );
  }
}

// DELETE /api/files/[id] - Delete a single file by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 },
      );
    }

    // Get file from database first to get filename for deletion
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 },
      );
    }

    // Delete file from database
    await db.delete(files).where(eq(files.id, id));

    // Delete physical file (optional - import deleteFile if needed)
    // await deleteFile(file.filename);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
