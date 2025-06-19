"use client";

import React, { useState, useCallback } from "react";
import {
  FileUploadProgress,
  FileValidationError,
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES,
} from "@/types/file";
import { fileActivityLogger } from "@/utils/logging";

interface FileUploadProps {
  onUploadComplete?: (file: unknown) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>(
    [],
  );
  const [validationErrors, setValidationErrors] = useState<
    FileValidationError[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime: number;
    total: number;
  } | null>(null);

  const COMPONENT_NAME = "FileUpload";

  const validateFile = (file: File): FileValidationError | null => {
    fileActivityLogger.logPerformanceMetric(
      COMPONENT_NAME,
      "file-validation-start",
      Date.now(),
      "timestamp",
    );

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const error = {
        type: "size" as const,
        message: `File size must be less than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`,
        filename: file.name,
      };

      fileActivityLogger.logValidationError(
        COMPONENT_NAME,
        file.name,
        "size",
        error.message,
      );

      return error;
    }

    // Check file type
    if (
      !SUPPORTED_FILE_TYPES.includes(
        file.type as (typeof SUPPORTED_FILE_TYPES)[number],
      )
    ) {
      const error = {
        type: "type" as const,
        message:
          "Unsupported file type. Please upload JPG, PNG, GIF, SVG, TXT, MD, or CSV files.",
        filename: file.name,
      };

      fileActivityLogger.logValidationError(
        COMPONENT_NAME,
        file.name,
        "type",
        error.message,
      );

      return error;
    }

    fileActivityLogger.logPerformanceMetric(
      COMPONENT_NAME,
      "file-validation-success",
      Date.now(),
      "timestamp",
    );

    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const startTime = Date.now();
      const fileArray = Array.from(files);
      const errors: FileValidationError[] = [];
      const validFiles: File[] = [];

      fileActivityLogger.logPerformanceMetric(
        COMPONENT_NAME,
        "file-processing-start",
        startTime,
        "timestamp",
      );

      // Log the batch operation attempt
      fileActivityLogger.logBatchOperation(
        COMPONENT_NAME,
        "file-upload-batch",
        fileArray.map((f) => f.name),
        true,
      );

      // Validate all files
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      setValidationErrors(errors);

      if (validFiles.length === 0) {
        return;
      }

      // Log upload start for valid files
      fileActivityLogger.logUploadStart(COMPONENT_NAME, validFiles);

      setIsUploading(true);

      // Upload valid files
      for (const file of validFiles) {
        const uploadStartTime = Date.now();

        try {
          const progress: FileUploadProgress = {
            filename: file.name,
            progress: 0,
            status: "uploading",
          };

          setUploadProgress((prev) => [...prev, progress]);

          // Log progress update
          fileActivityLogger.logUploadProgress(COMPONENT_NAME, file.name, 0);

          // Create FormData for API call
          const formData = new FormData();
          formData.append("file", file);

          // Update progress to show upload starting
          setUploadProgress((prev) =>
            prev.map((p) =>
              p.filename === file.name ? { ...p, progress: 50 } : p,
            ),
          );

          fileActivityLogger.logUploadProgress(COMPONENT_NAME, file.name, 50);

          // Call the actual API endpoint
          const response = await fetch("/api/files", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          // Update rate limit info
          if (result.rateLimit) {
            setRateLimitInfo(result.rateLimit);
          }

          if (!response.ok || !result.success) {
            // Handle rate limit specifically
            if (response.status === 429) {
              const resetDate = new Date(
                result.rateLimit?.resetTime || Date.now() + 15 * 60 * 1000,
              );
              throw new Error(
                `Rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`,
              );
            }
            throw new Error(result.error || "Upload failed");
          }

          // Mark as completed
          setUploadProgress((prev) =>
            prev.map((p) =>
              p.filename === file.name
                ? { ...p, status: "completed", progress: 100 }
                : p,
            ),
          );

          // Log successful upload
          const uploadDuration = Date.now() - uploadStartTime;
          const fileWithTiming = {
            ...result.file,
            uploadStartTime,
            uploadDuration,
          };

          fileActivityLogger.logUploadComplete(COMPONENT_NAME, fileWithTiming);
          fileActivityLogger.logPerformanceMetric(
            COMPONENT_NAME,
            "upload-duration",
            uploadDuration,
            "milliseconds",
          );

          onUploadComplete?.(result.file);
        } catch (error) {
          // Log upload error
          fileActivityLogger.logUploadError(
            COMPONENT_NAME,
            file.name,
            error instanceof Error ? error : String(error),
          );

          setUploadProgress((prev) =>
            prev.map((p) =>
              p.filename === file.name
                ? { ...p, status: "error", error: "Upload failed" }
                : p,
            ),
          );
          onUploadError?.(`Failed to upload ${file.name}`);
        }
      }

      const totalProcessingTime = Date.now() - startTime;
      fileActivityLogger.logPerformanceMetric(
        COMPONENT_NAME,
        "batch-upload-duration",
        totalProcessingTime,
        "milliseconds",
      );

      setIsUploading(false);
    },
    [onUploadComplete, onUploadError],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileActivityLogger.logPerformanceMetric(
          COMPONENT_NAME,
          "drag-drop-files",
          files.length,
          "count",
        );
        handleFiles(files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      fileActivityLogger.logPerformanceMetric(
        COMPONENT_NAME,
        "file-input-selection",
        files.length,
        "count",
      );
      handleFiles(files);
    }
  };

  const clearProgress = () => {
    fileActivityLogger.logPerformanceMetric(
      COMPONENT_NAME,
      "clear-progress",
      uploadProgress.length,
      "count",
    );
    setUploadProgress([]);
    setValidationErrors([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Upload Files
          </h2>

          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${
                isDragOver
                  ? "border-blue-400 bg-blue-500/20"
                  : "border-white/30 hover:border-white/50"
              }
              ${isUploading ? "pointer-events-none opacity-50" : ""}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileInput}
              disabled={isUploading}
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                <svg
                  className="w-12 h-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div>
                <p className="text-lg font-medium text-white">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Support for JPG, PNG, GIF, SVG, TXT, MD, CSV files up to{" "}
                  {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-6 space-y-2">
              {validationErrors.map((error, index) => (
                <div
                  key={index}
                  className="bg-red-900/50 backdrop-blur-sm border border-red-500/50 rounded-md p-4"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-200">
                        {error.filename}
                      </h3>
                      <p className="text-sm text-red-300 mt-1">
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  Upload Progress
                </h3>
                {!isUploading && (
                  <button
                    onClick={clearProgress}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {uploadProgress.map((progress, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white truncate">
                        {progress.filename}
                      </span>
                      <div className="flex items-center space-x-2">
                        {progress.status === "completed" && (
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {progress.status === "error" && (
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span className="text-sm text-gray-300">
                          {progress.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.status === "completed"
                            ? "bg-gradient-to-r from-green-400 to-green-500"
                            : progress.status === "error"
                              ? "bg-gradient-to-r from-red-400 to-red-500"
                              : "bg-gradient-to-r from-blue-500 to-purple-600"
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>

                    {progress.error && (
                      <p className="text-sm text-red-300 mt-2">
                        {progress.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate Limit Info */}
          {rateLimitInfo && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Upload Limits
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {rateLimitInfo.remaining} of {rateLimitInfo.total} uploads
                    remaining. Resets at{" "}
                    {new Date(rateLimitInfo.resetTime).toLocaleTimeString()}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadProgress.some((p) => p.status === "completed") &&
            !isUploading && (
              <div className="mt-6 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-200">
                      Upload Successful
                    </h3>
                    <p className="text-sm text-green-300 mt-1">
                      Your files have been uploaded successfully.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
