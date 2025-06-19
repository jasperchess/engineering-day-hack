import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files, sharedFiles } from "@/app/auth/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { withAuth } from "@/app/auth/middleware";
import { generateShareCode, createShareableLink } from "@/utils/urlSigning";
import { fileActivityLogger } from "@/utils/logging";

interface ShareFileRequest {
  permissions?: 'view' | 'download' | 'both';
  expiresIn?: number; // hours
  maxDownloads?: number;
}

interface ShareFileResponse {
  success: boolean;
  shareData?: {
    shareCode: string;
    url: string;
    expiresAt: string;
    permissions: string;
    maxDownloads?: number;
  };
  error?: string;
}

// POST /api/files/[id]/share - Create a shareable link for a file
export const POST = withAuth(async (request: NextRequest, session: any) => {
  const requestStartTime = Date.now();
  const url = new URL(request.url);
  const fileId = url.pathname.split('/')[3]; // Extract file ID from path

  // Log API request
  fileActivityLogger.logApiRequest("FileShare", "POST", `/api/files/${fileId}/share`, {
    userId: session.user?.id,
    fileId,
    details: {
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      timestamp: new Date().toISOString(),
    },
  });

  try {
    // Parse request body
    const body: ShareFileRequest = await request.json().catch(() => ({}));
    const { permissions = 'both', expiresIn = 24, maxDownloads } = body;

    // Validate input
    if (!['view', 'download', 'both'].includes(permissions)) {
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("FileShare", "POST", `/api/files/${fileId}/share`, 400, {
        userId: session.user.id,
        fileId,
        details: {
          error: "Invalid permissions value",
          validationType: "permissions",
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "Invalid permissions. Must be 'view', 'download', or 'both'" } as ShareFileResponse,
        { status: 400 }
      );
    }

    if (expiresIn < 1 || expiresIn > 8760) { // Max 1 year
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("FileShare", "POST", `/api/files/${fileId}/share`, 400, {
        userId: session.user.id,
        fileId,
        details: {
          error: "Invalid expiration time",
          validationType: "expiration",
          expiresIn,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "Expiration time must be between 1 hour and 1 year" } as ShareFileResponse,
        { status: 400 }
      );
    }

    if (maxDownloads && (maxDownloads < 1 || maxDownloads > 10000)) {
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("FileShare", "POST", `/api/files/${fileId}/share`, 400, {
        userId: session.user.id,
        fileId,
        details: {
          error: "Invalid max downloads",
          validationType: "max_downloads",
          maxDownloads,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "Max downloads must be between 1 and 10000" } as ShareFileResponse,
        { status: 400 }
      );
    }

    // Check if file exists and belongs to the user
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file) {
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("FileShare", "POST", `/api/files/${fileId}/share`, 404, {
        userId: session.user.id,
        fileId,
        details: {
          error: "File not found",
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "File not found" } as ShareFileResponse,
        { status: 404 }
      );
    }

    if (file.uploadedBy !== session.user.id) {
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("FileShare", "POST", `/api/files/${fileId}/share`, 403, {
        userId: session.user.id,
        fileId,
        details: {
          error: "Access denied",
          fileOwnerId: file.uploadedBy,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "You don't have permission to share this file" } as ShareFileResponse,
        { status: 403 }
      );
    }

    // Generate share code and create shareable link
    const shareCode = generateShareCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 60 * 60 * 1000);

    // Create shared file record
    const sharedFileData = {
      id: randomUUID(),
      fileId: file.id,
      shareCode,
      sharedBy: session.user.id,
      permissions,
      maxDownloads,
      downloadCount: 0,
      viewCount: 0,
      expiresAt,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const [sharedFile] = await db
      .insert(sharedFiles)
      .values(sharedFileData)
      .returning();

    // Generate the public URL
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const shareableLink = createShareableLink(baseUrl, {
      fileId: file.id,
      fileName: file.originalName,
      permissions,
      expiresIn,
      maxDownloads,
    });

    // Update the shareable link to use our share code endpoint
    const publicUrl = `${baseUrl}/share/${shareCode}`;

    const requestDuration = Date.now() - requestStartTime;

    // Log successful share creation
    fileActivityLogger.logApiResponse("FileShare", "POST", `/api/files/${fileId}/share`, 200, {
      userId: session.user.id,
      fileId,
      details: {
        shareCode,
        permissions,
        expiresIn,
        maxDownloads,
        expiresAt: expiresAt.toISOString(),
        success: true,
        duration: requestDuration,
        timestamp: new Date().toISOString(),
      },
    });

    // Log share activity
    fileActivityLogger.logActivity("file_shared", "FileShare", {
      level: "info",
      userId: session.user.id,
      fileId,
      details: {
        shareCode,
        fileName: file.originalName,
        permissions,
        expiresAt: expiresAt.toISOString(),
        maxDownloads,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      shareData: {
        shareCode,
        url: publicUrl,
        expiresAt: expiresAt.toISOString(),
        permissions,
        maxDownloads,
      },
    } as ShareFileResponse);

  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    // Log API error
    fileActivityLogger.logApiError(
      "FileShare",
      "POST",
      `/api/files/${fileId}/share`,
      error instanceof Error ? error : String(error),
      {
        userId: session.user?.id,
        fileId,
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.error("File share error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shareable link" } as ShareFileResponse,
      { status: 500 }
    );
  }
});

// GET /api/files/[id]/share - Get existing shares for a file
export const GET = withAuth(async (request: NextRequest, session: any) => {
  const requestStartTime = Date.now();
  const url = new URL(request.url);
  const fileId = url.pathname.split('/')[3];

  // Log API request
  fileActivityLogger.logApiRequest("FileShare", "GET", `/api/files/${fileId}/share`, {
    userId: session.user?.id,
    fileId,
    details: {
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      timestamp: new Date().toISOString(),
    },
  });

  try {
    // Check if file exists and belongs to the user
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file || file.uploadedBy !== session.user.id) {
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("FileShare", "GET", `/api/files/${fileId}/share`, 404, {
        userId: session.user.id,
        fileId,
        details: {
          error: "File not found or access denied",
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Get active shares for this file
    const shares = await db
      .select()
      .from(sharedFiles)
      .where(eq(sharedFiles.fileId, fileId));

    // Filter active and non-expired shares
    const now = new Date();
    const activeShares = shares.filter(share =>
      share.isActive && share.expiresAt > now
    );

    const requestDuration = Date.now() - requestStartTime;

    // Log successful shares fetch
    fileActivityLogger.logApiResponse("FileShare", "GET", `/api/files/${fileId}/share`, 200, {
      userId: session.user.id,
      fileId,
      details: {
        totalShares: shares.length,
        activeShares: activeShares.length,
        success: true,
        duration: requestDuration,
        timestamp: new Date().toISOString(),
      },
    });

    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    return NextResponse.json({
      success: true,
      shares: activeShares.map(share => ({
        shareCode: share.shareCode,
        url: `${baseUrl}/share/${share.shareCode}`,
        permissions: share.permissions,
        maxDownloads: share.maxDownloads,
        downloadCount: share.downloadCount,
        viewCount: share.viewCount,
        expiresAt: share.expiresAt.toISOString(),
        createdAt: share.createdAt.toISOString(),
      })),
    });

  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    // Log API error
    fileActivityLogger.logApiError(
      "FileShare",
      "GET",
      `/api/files/${fileId}/share`,
      error instanceof Error ? error : String(error),
      {
        userId: session.user?.id,
        fileId,
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.error("Get file shares error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shares" },
      { status: 500 }
    );
  }
});

// DELETE /api/files/[id]/share - Revoke all shares for a file
export const DELETE = withAuth(async (request: NextRequest, session: any) => {
  const requestStartTime = Date.now();
  const url = new URL(request.url);
  const fileId = url.pathname.split('/')[3];

  // Log API request
  fileActivityLogger.logApiRequest("FileShare", "DELETE", `/api/files/${fileId}/share`, {
    userId: session.user?.id,
    fileId,
    details: {
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      timestamp: new Date().toISOString(),
    },
  });

  try {
    // Check if file exists and belongs to the user
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file || file.uploadedBy !== session.user.id) {
      const requestDuration = Date.now() - requestStartTime;

      fileActivityLogger.logApiResponse("FileShare", "DELETE", `/api/files/${fileId}/share`, 404, {
        userId: session.user.id,
        fileId,
        details: {
          error: "File not found or access denied",
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Deactivate all shares for this file
    const result = await db
      .update(sharedFiles)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(sharedFiles.fileId, fileId));

    const requestDuration = Date.now() - requestStartTime;

    // Log successful share revocation
    fileActivityLogger.logApiResponse("FileShare", "DELETE", `/api/files/${fileId}/share`, 200, {
      userId: session.user.id,
      fileId,
      details: {
        success: true,
        duration: requestDuration,
        timestamp: new Date().toISOString(),
      },
    });

    // Log share revocation activity
    fileActivityLogger.logActivity("file_shares_revoked", "FileShare", {
      level: "info",
      userId: session.user.id,
      fileId,
      details: {
        fileName: file.originalName,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "All shares for this file have been revoked",
    });

  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    // Log API error
    fileActivityLogger.logApiError(
      "FileShare",
      "DELETE",
      `/api/files/${fileId}/share`,
      error instanceof Error ? error : String(error),
      {
        userId: session.user?.id,
        fileId,
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.error("Revoke file shares error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke shares" },
      { status: 500 }
    );
  }
});
