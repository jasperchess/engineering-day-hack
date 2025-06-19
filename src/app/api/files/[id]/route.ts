import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files } from "@/app/auth/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/app/auth/middleware";
import { FileItem } from "@/types/file";
import { fileActivityLogger } from "@/utils/logging";

// GET /api/files/[id] - Get a single file by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (req: NextRequest, session: any) => {
    const requestStartTime = Date.now();
    const { id } = params;
    const fileId = id;

    // Log API request
    fileActivityLogger.logApiRequest(
      "FileDetailsAPI",
      "GET",
      `/api/files/${fileId}`,
      {
        userId: session.user?.id,
        fileId: fileId,
        details: {
          userAgent: request.headers.get("user-agent"),
          origin: request.headers.get("origin"),
          timestamp: new Date().toISOString(),
        },
      },
    );

    try {
      if (!id) {
        return NextResponse.json(
          { success: false, error: "File ID is required" },
          { status: 400 },
        );
      }

      // Get file from database, only if owned by user
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.uploadedBy, session.user.id)))
        .limit(1);

      if (!file) {
        fileActivityLogger.logApiResponse(
          "FileDetailsAPI",
          "GET",
          `/api/files/${fileId}`,
          404,
          {
            userId: session.user?.id,
            fileId: fileId,
            details: {
              error: "File not found",
              duration: Date.now() - requestStartTime,
              timestamp: new Date().toISOString(),
            },
          },
        );

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

      const requestDuration = Date.now() - requestStartTime;

      // Log successful file fetch
      fileActivityLogger.logApiResponse(
        "FileDetailsAPI",
        "GET",
        `/api/files/${fileId}`,
        200,
        {
          userId: session.user.id,
          fileId: fileItem.id,
          fileName: fileItem.originalName,
          fileSize: fileItem.fileSize,
          details: {
            fileId: fileItem.id,
            originalName: fileItem.originalName,
            fileSize: fileItem.fileSize,
            fileType: fileItem.fileType,
            success: true,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        },
      );

      return NextResponse.json({
        success: true,
        file: fileItem,
      });
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;

      // Log API error
      fileActivityLogger.logApiError(
        "FileDetailsAPI",
        "GET",
        `/api/files/${fileId}`,
        error instanceof Error ? error : String(error),
        {
          userId: session.user?.id,
          fileId: fileId,
          details: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        },
      );

      console.error("File fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch file" },
        { status: 500 },
      );
    }
  })(request);
}

// DELETE /api/files/[id] - Delete a single file by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (req: NextRequest, session: any) => {
    const requestStartTime = Date.now();
    const { id } = params;
    const fileId = id;

    // Log API request
    fileActivityLogger.logApiRequest(
      "FileDetailsAPI",
      "DELETE",
      `/api/files/${fileId}`,
      {
        userId: session.user?.id,
        fileId: fileId,
        details: {
          userAgent: request.headers.get("user-agent"),
          origin: request.headers.get("origin"),
          timestamp: new Date().toISOString(),
        },
      },
    );

    try {
      if (!id) {
        return NextResponse.json(
          { success: false, error: "File ID is required" },
          { status: 400 },
        );
      }

      // Get file from database first, only if owned by user
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.uploadedBy, session.user.id)))
        .limit(1);

      if (!file) {
        fileActivityLogger.logApiResponse(
          "FileDetailsAPI",
          "DELETE",
          `/api/files/${fileId}`,
          404,
          {
            userId: session.user?.id,
            fileId: fileId,
            details: {
              error: "File not found",
              duration: Date.now() - requestStartTime,
              timestamp: new Date().toISOString(),
            },
          },
        );

        return NextResponse.json(
          { success: false, error: "File not found" },
          { status: 404 },
        );
      }

      // Delete file from database
      await db
        .delete(files)
        .where(
          and(eq(files.id, fileId), eq(files.uploadedBy, session.user.id)),
        );

      // Delete physical file (optional - import deleteFile if needed)
      // await deleteFile(file.filename);

      const requestDuration = Date.now() - requestStartTime;

      // Log successful file deletion
      fileActivityLogger.logApiResponse(
        "FileDetailsAPI",
        "DELETE",
        `/api/files/${fileId}`,
        200,
        {
          userId: session.user.id,
          fileId: file.id,
          fileName: file.originalName,
          details: {
            fileId: file.id,
            originalName: file.originalName,
            filename: file.filename,
            fileSize: file.fileSize,
            success: true,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        },
      );

      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;

      // Log API error
      fileActivityLogger.logApiError(
        "FileDetailsAPI",
        "DELETE",
        `/api/files/${fileId}`,
        error instanceof Error ? error : String(error),
        {
          userId: session.user?.id,
          fileId: fileId,
          details: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        },
      );

      console.error("File deletion error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete file" },
        { status: 500 },
      );
    }
  })(request);
}
