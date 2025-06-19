import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files } from "@/app/auth/schema";
import { eq, and, inArray } from "drizzle-orm";
import { withAuth } from "@/app/auth/middleware";
import { fileActivityLogger } from "@/utils/logging";

// POST /api/files/download - Get download URLs for multiple files
export const POST = withAuth(
  async (request: NextRequest, session: { user: { id: string } }) => {
    const requestStartTime = Date.now();

    try {
      const body = await request.json();
      const { fileIds } = body;

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "File IDs are required" },
          { status: 400 },
        );
      }

      // Log API request
      fileActivityLogger.logApiRequest(
        "FileDownloadAPI",
        "POST",
        "/api/files/download",
        {
          userId: session.user?.id,
          fileId: fileIds[0], // Use first file ID for logging
          details: {
            userAgent: request.headers.get("user-agent"),
            origin: request.headers.get("origin"),
            timestamp: new Date().toISOString(),
            fileIds: fileIds,
            count: fileIds.length,
          },
        },
      );

      // Get files from database, only if owned by user
      const userFiles = await db
        .select()
        .from(files)
        .where(
          and(
            inArray(files.id, fileIds),
            eq(files.uploadedBy, session.user.id),
          ),
        );

      if (userFiles.length === 0) {
        fileActivityLogger.logApiResponse(
          "FileDownloadAPI",
          "POST",
          "/api/files/download",
          404,
          {
            userId: session.user?.id,
            fileId: fileIds[0], // Use first file ID for logging
            details: {
              error: "No files found or access denied",
              requestedCount: fileIds.length,
              foundCount: 0,
              duration: Date.now() - requestStartTime,
              timestamp: new Date().toISOString(),
              fileIds: fileIds,
            },
          },
        );

        return NextResponse.json(
          { success: false, error: "No files found or access denied" },
          { status: 404 },
        );
      }

      // Return download URLs for each file
      const downloadUrls = userFiles.map((file) => ({
        id: file.id,
        filename: file.originalName,
        downloadUrl: `/api/files/download/${file.id}`,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));

      // Log successful batch download preparation
      fileActivityLogger.logApiResponse(
        "FileDownloadAPI",
        "POST",
        "/api/files/download",
        200,
        {
          userId: session.user.id,
          fileId: userFiles[0].id, // Use first file ID for logging
          details: {
            type: "batch-download-urls",
            fileCount: userFiles.length,
            files: userFiles.map((f) => ({
              id: f.id,
              name: f.originalName,
              size: f.fileSize,
            })),
            success: true,
            duration: Date.now() - requestStartTime,
            timestamp: new Date().toISOString(),
            fileIds: userFiles.map((f) => f.id),
          },
        },
      );

      return NextResponse.json({
        success: true,
        files: downloadUrls,
      });
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;

      // Log API error
      fileActivityLogger.logApiError(
        "FileDownloadAPI",
        "POST",
        "/api/files/download",
        error instanceof Error ? error : String(error),
        {
          userId: session.user?.id,
          details: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        },
      );

      console.error("Batch download error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to prepare downloads" },
        { status: 500 },
      );
    }
  },
);
