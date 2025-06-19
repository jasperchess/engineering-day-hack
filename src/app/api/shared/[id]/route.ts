import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files, sharedFiles, shareAccessLog } from "@/app/auth/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { verifyPresignedUrl } from "@/utils/urlSigning";
import { fileActivityLogger } from "@/utils/logging";
import path from "path";
import fs from "fs/promises";

interface SharedFileResponse {
  success: boolean;
  file?: {
    id: string;
    filename: string;
    originalName: string;
    fileSize: number;
    fileType: string;
    mimeType: string;
    downloadUrl?: string;
    viewUrl?: string;
  };
  shareInfo?: {
    permissions: string;
    remainingDownloads?: number;
    expiresAt: string;
  };
  error?: string;
}

// GET /api/shared/[id] - Access shared file with pre-signed URL or share code
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestStartTime = Date.now();
  const fileId = params.id;
  const url = new URL(request.url);

  // Extract query parameters for pre-signed URL verification
  const token = url.searchParams.get('token');
  const signature = url.searchParams.get('signature');
  const action = url.searchParams.get('action') || 'view'; // 'view' or 'download'

  // Get client info for logging
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const referrer = request.headers.get('referer') || 'unknown';

  // Log public access attempt
  fileActivityLogger.logApiRequest("SharedFile", "GET", `/api/shared/${fileId}`, {
    details: {
      fileId,
      action,
      hasToken: !!token,
      hasSignature: !!signature,
      ipAddress,
      userAgent,
      referrer,
      timestamp: new Date().toISOString(),
    },
  });

  try {
    let sharedFile = null;
    let accessMethod = '';

    // Method 1: Pre-signed URL with token and signature
    if (token && signature) {
      accessMethod = 'presigned_url';

      // Verify the pre-signed URL
      const verification = verifyPresignedUrl(token, signature);

      if (!verification.isValid) {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${fileId}`, 403, {
          details: {
            error: verification.isExpired ? "Link expired" : "Invalid signature",
            accessMethod,
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: verification.isExpired ? "This link has expired" : "Invalid or tampered link"
          } as SharedFileResponse,
          { status: 403 }
        );
      }

      // Check if the fileId matches
      if (verification.fileId !== fileId) {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${fileId}`, 403, {
          details: {
            error: "File ID mismatch",
            accessMethod,
            expectedFileId: verification.fileId,
            actualFileId: fileId,
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          { success: false, error: "Invalid link" } as SharedFileResponse,
          { status: 403 }
        );
      }

      // Check permissions
      if (action === 'download' && verification.permissions === 'view') {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${fileId}`, 403, {
          details: {
            error: "Download not permitted",
            accessMethod,
            permissions: verification.permissions,
            action,
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          { success: false, error: "Download not permitted for this link" } as SharedFileResponse,
          { status: 403 }
        );
      }

      // Find the shared file record for usage tracking
      const sharedFileRecords = await db
        .select()
        .from(sharedFiles)
        .where(
          and(
            eq(sharedFiles.fileId, fileId),
            eq(sharedFiles.isActive, true)
          )
        );

      // Use the most recent active share for tracking
      sharedFile = sharedFileRecords.find(sf => sf.expiresAt > new Date()) || null;
    }

    // Method 2: Share code lookup
    else {
      accessMethod = 'share_code';

      // Treat the fileId as a share code
      const shareCode = fileId;

      const [shareRecord] = await db
        .select()
        .from(sharedFiles)
        .where(
          and(
            eq(sharedFiles.shareCode, shareCode),
            eq(sharedFiles.isActive, true)
          )
        )
        .limit(1);

      if (!shareRecord) {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${fileId}`, 404, {
          details: {
            error: "Share not found",
            accessMethod,
            shareCode,
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          { success: false, error: "Shared file not found" } as SharedFileResponse,
          { status: 404 }
        );
      }

      // Check if expired
      if (shareRecord.expiresAt <= new Date()) {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${fileId}`, 410, {
          details: {
            error: "Share expired",
            accessMethod,
            shareCode,
            expiresAt: shareRecord.expiresAt.toISOString(),
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          { success: false, error: "This shared link has expired" } as SharedFileResponse,
          { status: 410 }
        );
      }

      // Check download limits
      if (action === 'download' && shareRecord.maxDownloads &&
          shareRecord.downloadCount >= shareRecord.maxDownloads) {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${fileId}`, 403, {
          details: {
            error: "Download limit exceeded",
            accessMethod,
            shareCode,
            maxDownloads: shareRecord.maxDownloads,
            downloadCount: shareRecord.downloadCount,
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          { success: false, error: "Download limit exceeded for this link" } as SharedFileResponse,
          { status: 403 }
        );
      }

      // Check permissions
      if (action === 'download' && shareRecord.permissions === 'view') {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${fileId}`, 403, {
          details: {
            error: "Download not permitted",
            accessMethod,
            permissions: shareRecord.permissions,
            action,
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json(
          { success: false, error: "Download not permitted for this link" } as SharedFileResponse,
          { status: 403 }
        );
      }

      sharedFile = shareRecord;
      fileId = shareRecord.fileId; // Update fileId to actual file ID
    }

    // Get the file information
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file) {
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${params.id}`, 404, {
        details: {
          error: "File not found",
          accessMethod,
          fileId,
          ipAddress,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "File not found" } as SharedFileResponse,
        { status: 404 }
      );
    }

    // Log access attempt
    if (sharedFile) {
      try {
        await db.insert(shareAccessLog).values({
          id: randomUUID(),
          sharedFileId: sharedFile.id,
          accessType: action as 'view' | 'download',
          ipAddress,
          userAgent,
          referrer,
          accessedAt: new Date(),
        });

        // Update usage counters
        if (action === 'download') {
          await db
            .update(sharedFiles)
            .set({
              downloadCount: sharedFile.downloadCount + 1,
              updatedAt: new Date()
            })
            .where(eq(sharedFiles.id, sharedFile.id));
        } else {
          await db
            .update(sharedFiles)
            .set({
              viewCount: sharedFile.viewCount + 1,
              updatedAt: new Date()
            })
            .where(eq(sharedFiles.id, sharedFile.id));
        }
      } catch (error) {
        console.error("Failed to log access:", error);
        // Continue with the request even if logging fails
      }
    }

    // Handle file download
    if (action === 'download') {
      try {
        const filePath = path.join(process.cwd(), 'uploads', file.filename);
        const fileBuffer = await fs.readFile(filePath);

        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${params.id}`, 200, {
          details: {
            action: 'download',
            accessMethod,
            fileId: file.id,
            fileName: file.originalName,
            fileSize: file.fileSize,
            ipAddress,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        });

        // Log file download activity
        fileActivityLogger.logActivity("file_downloaded", "SharedFile", {
          level: "info",
          fileId: file.id,
          details: {
            accessMethod,
            fileName: file.originalName,
            fileSize: file.fileSize,
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString(),
          },
        });

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
            'Content-Length': file.fileSize.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (error) {
        const requestDuration = Date.now() - requestStartTime;

        fileActivityLogger.logApiError(
          "SharedFile",
          "GET",
          `/api/shared/${params.id}`,
          error instanceof Error ? error : String(error),
          {
            details: {
              action: 'download',
              fileId: file.id,
              fileName: file.originalName,
              error: error instanceof Error ? error.message : String(error),
              ipAddress,
              duration: requestDuration,
              timestamp: new Date().toISOString(),
            },
          }
        );

        return NextResponse.json(
          { success: false, error: "File not available for download" } as SharedFileResponse,
          { status: 500 }
        );
      }
    }

    // Handle file info/view
    const requestDuration = Date.now() - requestStartTime;

    fileActivityLogger.logApiResponse("SharedFile", "GET", `/api/shared/${params.id}`, 200, {
      details: {
        action: 'view',
        accessMethod,
        fileId: file.id,
        fileName: file.originalName,
        fileSize: file.fileSize,
        ipAddress,
        duration: requestDuration,
        timestamp: new Date().toISOString(),
      },
    });

    // Log file view activity
    fileActivityLogger.logActivity("file_viewed", "SharedFile", {
      level: "info",
      fileId: file.id,
      details: {
        accessMethod,
        fileName: file.originalName,
        fileSize: file.fileSize,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      },
    });

    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        mimeType: file.mimeType,
        downloadUrl: `${baseUrl}/api/shared/${params.id}?action=download${token ? `&token=${token}&signature=${signature}` : ''}`,
        viewUrl: file.url,
      },
      shareInfo: sharedFile ? {
        permissions: sharedFile.permissions,
        remainingDownloads: sharedFile.maxDownloads ?
          Math.max(0, sharedFile.maxDownloads - sharedFile.downloadCount) :
          undefined,
        expiresAt: sharedFile.expiresAt.toISOString(),
      } : undefined,
    } as SharedFileResponse);

  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    fileActivityLogger.logApiError(
      "SharedFile",
      "GET",
      `/api/shared/${params.id}`,
      error instanceof Error ? error : String(error),
      {
        details: {
          fileId: params.id,
          action,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          ipAddress,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.error("Shared file access error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to access shared file" } as SharedFileResponse,
      { status: 500 }
    );
  }
}
