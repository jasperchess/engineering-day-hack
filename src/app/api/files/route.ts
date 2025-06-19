import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files } from "@/app/auth/schema";
import { randomUUID } from "crypto";
import {
  validateFileStream,
  saveFile,
  generateUniqueFilename,
  getFileUrl,
  getFileTypeCategory,
} from "@/utils/fileUtils";
import { FileUploadResponse, FileListResponse } from "@/types/file";
import { count, desc, eq, like } from "drizzle-orm";
import { withAuth } from "@/app/auth/middleware";
import { uploadRateLimit, apiRateLimit, getClientIdentifier } from "@/utils/rateLimit";
import { fileActivityLogger } from "@/utils/logging";

// POST /api/files - Upload a new file
export const POST = withAuth(async (request: NextRequest, session: any) => {
  const requestStartTime = Date.now();

  // Log API request
  fileActivityLogger.logApiRequest("FilesAPI", "POST", "/api/files", {
    userId: session.user?.id,
    details: {
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      timestamp: new Date().toISOString(),
    },
  });

  try {
    // Check rate limit first
    const identifier = getClientIdentifier(request, session.user?.id);
    const rateLimitResult = uploadRateLimit.check(identifier);

    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime).toISOString();
      const requestDuration = Date.now() - requestStartTime;

      // Log rate limit exceeded
      fileActivityLogger.logApiResponse("FilesAPI", "POST", "/api/files", 429, {
        userId: session.user?.id,
        details: {
          error: "Rate limit exceeded",
          resetTime: resetTime,
          remaining: rateLimitResult.remaining,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again after ${resetTime}`,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
            total: rateLimitResult.total,
          },
        } as FileUploadResponse,
        {
          status: 429,
          headers: uploadRateLimit.getHeaders(rateLimitResult),
        },
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file") as File;

    if (!uploadedFile) {
      const requestDuration = Date.now() - requestStartTime;

      // Log validation error
      fileActivityLogger.logApiResponse("FilesAPI", "POST", "/api/files", 400, {
        userId: session.user?.id,
        details: {
          error: "No file provided",
          validationType: "file_presence",
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: "No file provided" } as FileUploadResponse,
        { status: 400 },
      );
    }

    // Validate the file with stream validation to prevent spoofing
    const validationError = await validateFileStream(uploadedFile);
    // Log file upload attempt details
    fileActivityLogger.logApiRequest("FilesAPI", "POST", "/api/files", {
      userId: session.user?.id,
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.type,
      details: {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
        uploadStartTime: Date.now(),
        timestamp: new Date().toISOString(),
      },
    });
    if (validationError) {
      const requestDuration = Date.now() - requestStartTime;

      // Log validation error
      fileActivityLogger.logApiResponse("FilesAPI", "POST", "/api/files", 400, {
        userId: session.user?.id,
        fileName: uploadedFile.name,
        details: {
          error: validationError.message,
          validationType: validationError.type,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          fileType: uploadedFile.type,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: validationError.message,
        } as FileUploadResponse,
        { status: 400 },
      );
    }

    // Generate unique filename
    const filename = generateUniqueFilename(uploadedFile.name);

    // Save file to disk with additional stream validation
    try {
      await saveFile(uploadedFile, filename);
    } catch (saveError) {
      // If save fails due to size validation, return specific error
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Failed to save file";
      return NextResponse.json(
        {
          success: false,
          error: errorMessage.includes("size")
            ? errorMessage
            : "File upload failed due to validation error",
        } as FileUploadResponse,
        { status: 413 }, // 413 Payload Too Large for size-related errors
      );
    }

    // Get file URL
    const url = getFileUrl(filename);

    // Create file record in database
    const now = new Date();
    const fileRecord = {
      id: randomUUID(),
      filename,
      originalName: uploadedFile.name,
      fileSize: uploadedFile.size,
      fileType: getFileTypeCategory(uploadedFile.type),
      mimeType: uploadedFile.type,
      uploadDate: now,
      url,
      createdAt: now,
      updatedAt: now,
      uploadedBy: session.user.id,
    };

    const [insertedFile] = await db
      .insert(files)
      .values(fileRecord)
      .returning();

    const requestDuration = Date.now() - requestStartTime;

    // Log successful file upload
    fileActivityLogger.logApiResponse("FilesAPI", "POST", "/api/files", 200, {
      userId: session.user.id,
      fileId: insertedFile.id,
      fileName: insertedFile.originalName,
      fileSize: insertedFile.fileSize,
      fileType: insertedFile.fileType,
      details: {
        fileId: insertedFile.id,
        originalName: insertedFile.originalName,
        filename: insertedFile.filename,
        fileSize: insertedFile.fileSize,
        fileType: insertedFile.fileType,
        mimeType: insertedFile.mimeType,
        success: true,
        duration: requestDuration,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          id: insertedFile.id,
          filename: insertedFile.filename,
          originalName: insertedFile.originalName,
          fileSize: insertedFile.fileSize,
          fileType: insertedFile.fileType,
          mimeType: insertedFile.mimeType,
          uploadDate: insertedFile.uploadDate,
          uploadedBy: insertedFile.uploadedBy,
          url: insertedFile.url,
          thumbnailUrl: insertedFile.thumbnailUrl,
        },
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          total: rateLimitResult.total,
        },
      } as FileUploadResponse,
      {
        headers: uploadRateLimit.getHeaders(rateLimitResult),
      },
    );
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    // Log API error
    fileActivityLogger.logApiError(
      "FilesAPI",
      "POST",
      "/api/files",
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

    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" } as FileUploadResponse,
      { status: 500 },
    );
  }
});

// GET /api/files - Get user's files with optional search
export const GET = withAuth(async (request: NextRequest, session: any) => {
  const requestStartTime = Date.now();
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const search = url.searchParams.get("search")?.trim();

  // Check rate limit for API requests (especially search)
  const identifier = getClientIdentifier(request, session.user?.id);
  const rateLimitResult = apiRateLimit.check(identifier);

  if (!rateLimitResult.allowed) {
    const resetTime = new Date(rateLimitResult.resetTime).toISOString();
    return NextResponse.json(
      {
        success: false,
        error: `Too many requests. Try again after ${resetTime}`,
        files: [],
        total: 0,
      } as FileListResponse,
      {
        status: 429,
        headers: apiRateLimit.getHeaders(rateLimitResult),
      }
    );
  }

  // Log API request
  fileActivityLogger.logApiRequest("FilesAPI", "GET", "/api/files", {
    userId: session.user?.id,
    details: {
      limit,
      offset,
      search: search || null,
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      timestamp: new Date().toISOString(),
    },
  });

  try {
    // Build query with search conditions if provided
    let userFiles;
    let totalCountResult;

    if (search) {
      const searchPattern = `%${search}%`;
      
      // Get files with search filter (filename only)
      userFiles = await db
        .select()
        .from(files)
        .where(eq(files.uploadedBy, session.user.id))
        .where(like(files.originalName, searchPattern))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(files.uploadDate));

      // Get total count with search filter (filename only)
      totalCountResult = await db
        .select({ count: count() })
        .from(files)
        .where(eq(files.uploadedBy, session.user.id))
        .where(like(files.originalName, searchPattern));
    } else {
      // Get files without search filter
      userFiles = await db
        .select()
        .from(files)
        .where(eq(files.uploadedBy, session.user.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(files.uploadDate));

      // Get total count without search filter
      totalCountResult = await db
        .select({ count: count() })
        .from(files)
        .where(eq(files.uploadedBy, session.user.id));
    }

    const fileList = userFiles.map((fileRecord) => ({
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.originalName,
      fileSize: fileRecord.fileSize,
      fileType: fileRecord.fileType,
      mimeType: fileRecord.mimeType,
      uploadDate: fileRecord.uploadDate,
      uploadedBy: fileRecord.uploadedBy,
      url: fileRecord.url,
      thumbnailUrl: fileRecord.thumbnailUrl,
    }));

    const requestDuration = Date.now() - requestStartTime;
    const totalFiles = totalCountResult[0]?.count || 0;

    // Log successful files fetch
    fileActivityLogger.logApiResponse("FilesAPI", "GET", "/api/files", 200, {
      userId: session.user.id,
      details: {
        filesReturned: fileList.length,
        totalFiles: totalFiles,
        limit,
        offset,
        search: search || null,
        isSearchQuery: !!search,
        success: true,
        duration: requestDuration,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      files: fileList,
      total: totalFiles,
      search: search || null,
    } as FileListResponse, {
      headers: apiRateLimit.getHeaders(rateLimitResult),
    });
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    // Log API error
    fileActivityLogger.logApiError(
      "FilesAPI",
      "GET",
      "/api/files",
      error instanceof Error ? error : String(error),
      {
        userId: session.user?.id,
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          limit,
          offset,
          search: search || null,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      },
    );

    console.error("Files fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        files: [],
        total: 0,
        error: "Failed to fetch files",
      } as FileListResponse,
      { status: 500 },
    );
  }
});
