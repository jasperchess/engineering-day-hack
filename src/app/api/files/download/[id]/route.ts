import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files } from "@/app/auth/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/app/auth/middleware";
import { fileActivityLogger } from "@/utils/logging";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";

// GET /api/files/download/[id] - Download a single file by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(
    async (req: NextRequest, session: { user: { id: string } }) => {
      const requestStartTime = Date.now();
      const { id } = params;
      const fileId = id;

      // Log API request
      fileActivityLogger.logApiRequest(
        "FileDownloadAPI",
        "GET",
        `/api/files/download/${fileId}`,
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
          .where(
            and(eq(files.id, fileId), eq(files.uploadedBy, session.user.id)),
          )
          .limit(1);

        if (!file) {
          fileActivityLogger.logApiResponse(
            "FileDownloadAPI",
            "GET",
            `/api/files/download/${fileId}`,
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

        const filePath = path.join(process.cwd(), "uploads", file.filename);

        try {
          const stats = await stat(filePath);
          const fileStream = createReadStream(filePath);

          const headers = new Headers();
          headers.set(
            "Content-Type",
            file.mimeType || "application/octet-stream",
          );
          headers.set("Content-Length", stats.size.toString());
          headers.set(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          );

          // Log successful file download
          fileActivityLogger.logApiResponse(
            "FileDownloadAPI",
            "GET",
            `/api/files/download/${fileId}`,
            200,
            {
              userId: session.user.id,
              fileId: file.id,
              fileName: file.originalName,
              fileSize: file.fileSize,
              details: {
                fileId: file.id,
                originalName: file.originalName,
                fileSize: file.fileSize,
                success: true,
                duration: Date.now() - requestStartTime,
                timestamp: new Date().toISOString(),
              },
            },
          );

          return new Response(fileStream as ReadableStream, { headers });
        } catch (error) {
          console.error("Error reading file:", error);
          return NextResponse.json(
            { success: false, error: "File not found on disk" },
            { status: 404 },
          );
        }
      } catch (error) {
        const requestDuration = Date.now() - requestStartTime;

        // Log API error
        fileActivityLogger.logApiError(
          "FileDownloadAPI",
          "GET",
          `/api/files/download/${fileId}`,
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

        console.error("File download error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to download file" },
          { status: 500 },
        );
      }
    },
  )(request);
}
