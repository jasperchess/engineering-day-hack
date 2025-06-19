import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files, File as FileRecord } from "@/app/auth/schema";
import { randomUUID } from "crypto";
import {
  validateFile,
  saveFile,
  generateUniqueFilename,
  getFileUrl,
  getFileTypeCategory,
} from "@/utils/fileUtils";
import { FileUploadResponse, FileListResponse } from "@/types/file";
import { count, desc, eq } from "drizzle-orm";
import { withAuth } from "@/app/auth/middleware";
import { uploadRateLimit, getClientIdentifier } from "@/utils/rateLimit";

// POST /api/files - Upload a new file
export const POST = withAuth(async (request: NextRequest, session: any) => {
  try {
    // Check rate limit first
    const identifier = getClientIdentifier(request, session.user?.id);
    const rateLimitResult = uploadRateLimit.check(identifier);
    
    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime).toISOString();
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. Try again after ${resetTime}`,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
            total: rateLimitResult.total
          }
        } as FileUploadResponse,
        { 
          status: 429,
          headers: uploadRateLimit.getHeaders(rateLimitResult)
        }
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file") as File;

    if (!uploadedFile) {
      return NextResponse.json(
        { success: false, error: "No file provided" } as FileUploadResponse,
        { status: 400 },
      );
    }

    // Validate the file
    const validationError = validateFile(uploadedFile);
    if (validationError) {
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

    // Save file to disk
    await saveFile(uploadedFile, filename);

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

    return NextResponse.json({
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
        total: rateLimitResult.total
      }
    } as FileUploadResponse, {
      headers: uploadRateLimit.getHeaders(rateLimitResult)
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" } as FileUploadResponse,
      { status: 500 },
    );
  }
});

// GET /api/files - Get user's files
export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get files from database with pagination, filtered by user
    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.uploadedBy, session.user.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(files.uploadDate));

    // Get total count for user's files
    const totalCountResult = await db
      .select({ count: count() })
      .from(files)
      .where(eq(files.uploadedBy, session.user.id));

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

    return NextResponse.json({
      success: true,
      files: fileList,
      total: totalCountResult[0]?.count || 0,
    } as FileListResponse);
  } catch (error) {
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
