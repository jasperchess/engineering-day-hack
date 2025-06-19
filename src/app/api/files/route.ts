import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/auth/db";
import { files, File } from "@/app/auth/schema";
import { randomUUID } from "crypto";
import {
  validateFile,
  saveFile,
  generateUniqueFilename,
  getFileUrl,
  getFileTypeCategory,
} from "@/utils/fileUtils";
import { FileUploadResponse, FileListResponse } from "@/types/file";
import { count, desc } from "drizzle-orm";

// POST /api/files - Upload a new file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" } as FileUploadResponse,
        { status: 400 },
      );
    }

    // Validate the file
    const validationError = validateFile(file);
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
    const filename = generateUniqueFilename(file.name);

    // Save file to disk
    await saveFile(file, filename);

    // Get file URL
    const url = getFileUrl(filename);

    // Create file record in database
    const now = new Date();
    const fileRecord = {
      id: randomUUID(),
      filename,
      originalName: file.name,
      fileSize: file.size,
      fileType: getFileTypeCategory(file.type),
      mimeType: file.type,
      uploadDate: now,
      url,
      createdAt: now,
      updatedAt: now,
      // uploadedBy: user?.id, // TODO: Get from session when auth is implemented
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
    } as FileUploadResponse);
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" } as FileUploadResponse,
      { status: 500 },
    );
  }
}

// GET /api/files - Get all files
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get files from database with pagination
    const allFiles = await db
      .select()
      .from(files)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(files.uploadDate));

    // Get total count
    const totalCountResult = await db.select({ count: count() }).from(files);

    const fileList = allFiles.map((file: File) => ({
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
}
