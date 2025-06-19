"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileItem } from "@/types/file";
import { fileActivityLogger } from "@/utils/logging";

interface FileDownloadProps {
  file: FileItem;
  onDownload?: (file: FileItem) => void;
  onBack?: () => void;
}

export default function FileDownload({
  file,
  onDownload,
  onBack,
}: FileDownloadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");

  const COMPONENT_NAME = "FileDownload";

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const isText = (mimeType: string) => {
    return mimeType === "text/plain" || mimeType.startsWith("text/");
  };

  const isPDF = (mimeType: string) => {
    return mimeType === "application/pdf";
  };

  const canPreview = (mimeType: string) => {
    return isImage(mimeType) || isText(mimeType) || isPDF(mimeType);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return (
        <svg
          className="w-16 h-16 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (mimeType === "application/pdf") {
      return (
        <svg
          className="w-16 h-16 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (mimeType.includes("document") || mimeType.includes("word")) {
      return (
        <svg
          className="w-16 h-16 text-blue-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (mimeType.includes("sheet") || mimeType.includes("excel")) {
      return (
        <svg
          className="w-16 h-16 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-16 h-16 text-gray-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  const loadPreview = useCallback(async () => {
    if (!canPreview(file.mimeType)) {
      fileActivityLogger.logFilePreview(COMPONENT_NAME, file, "not-supported");
      return;
    }

    const previewStartTime = Date.now();
    setIsPreviewLoading(true);
    setPreviewError("");

    fileActivityLogger.logPerformanceMetric(
      COMPONENT_NAME,
      "preview-load-start",
      previewStartTime,
      "timestamp",
    );

    try {
      if (isText(file.mimeType)) {
        fileActivityLogger.logFilePreview(COMPONENT_NAME, file, "text");
        // Mock loading text content
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setTextContent(
          `This is a preview of ${file.originalName}.\n\nContent would be loaded from the actual file here...`,
        );
      } else if (isImage(file.mimeType) || isPDF(file.mimeType)) {
        const previewType = isImage(file.mimeType) ? "image" : "pdf";
        fileActivityLogger.logFilePreview(COMPONENT_NAME, file, previewType);
        // Mock loading preview URL
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPreviewUrl(file.url || `/api/files/${file.id}/preview`);
      }

      const previewLoadTime = Date.now() - previewStartTime;
      fileActivityLogger.logPerformanceMetric(
        COMPONENT_NAME,
        "preview-load-success",
        previewLoadTime,
        "milliseconds",
      );
    } catch (error) {
      const errorMessage = "Failed to load preview";
      setPreviewError(errorMessage);
      fileActivityLogger.logUploadError(
        COMPONENT_NAME,
        file.originalName,
        error instanceof Error ? error : errorMessage,
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }, [file, canPreview]);

  useEffect(() => {
    fileActivityLogger.logFileSelect(COMPONENT_NAME, file);
    loadPreview();
  }, [file, loadPreview]);

  const handleDownload = () => {
    fileActivityLogger.logFileDownload(COMPONENT_NAME, file);

    const downloadStartTime = Date.now();
    fileActivityLogger.logPerformanceMetric(
      COMPONENT_NAME,
      "download-start",
      downloadStartTime,
      "timestamp",
    );

    onDownload?.(file);

    // Create a temporary download link
    const link = document.createElement("a");
    link.href = file.url || `/api/files/${file.id}/download`;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log download completion (in a real app, you'd track actual completion)
    setTimeout(() => {
      const downloadDuration = Date.now() - downloadStartTime;
      fileActivityLogger.logPerformanceMetric(
        COMPONENT_NAME,
        "download-duration",
        downloadDuration,
        "milliseconds",
      );
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {onBack && (
                <button
                  onClick={() => {
                    fileActivityLogger.logPerformanceMetric(
                      COMPONENT_NAME,
                      "back-navigation",
                      1,
                      "count",
                    );
                    onBack();
                  }}
                  className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                  title="Back to files"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <div className="flex-shrink-0">{getFileIcon(file.mimeType)}</div>
              <div className="flex-1 min-w-0">
                <h1
                  className="text-2xl font-semibold text-white truncate"
                  title={file.originalName}
                >
                  {file.originalName}
                </h1>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300">
                  <div>
                    <span className="font-medium">Size:</span>{" "}
                    {formatFileSize(file.fileSize)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {file.mimeType}
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>{" "}
                    {formatDate(file.uploadDate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="p-6">
          {canPreview(file.mimeType) ? (
            <div>
              <h2 className="text-lg font-medium text-white mb-4">Preview</h2>

              {isPreviewLoading && (
                <div className="flex items-center justify-center h-64 bg-white/5 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-300">Loading preview...</p>
                  </div>
                </div>
              )}

              {previewError && (
                <div className="bg-red-900/50 backdrop-blur-sm border border-red-500/50 rounded-lg p-4">
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
                        Preview Error
                      </h3>
                      <p className="text-sm text-red-300 mt-1">
                        {previewError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isPreviewLoading && !previewError && (
                <div className="border border-white/20 rounded-lg overflow-hidden">
                  {isImage(file.mimeType) && previewUrl && (
                    <div className="bg-white/5 p-4">
                      <img
                        src={previewUrl}
                        alt={file.originalName}
                        className="max-w-full h-auto mx-auto rounded shadow-sm"
                        style={{ maxHeight: "500px" }}
                        onError={() => {
                          const errorMessage = "Failed to load image";
                          setPreviewError(errorMessage);
                          fileActivityLogger.logUploadError(
                            COMPONENT_NAME,
                            file.originalName,
                            errorMessage,
                          );
                        }}
                      />
                    </div>
                  )}

                  {isPDF(file.mimeType) && previewUrl && (
                    <div className="bg-white/5">
                      <iframe
                        src={previewUrl}
                        className="w-full h-96 border-0"
                        title={`Preview of ${file.originalName}`}
                        onError={() => {
                          const errorMessage = "Failed to load PDF";
                          setPreviewError(errorMessage);
                          fileActivityLogger.logUploadError(
                            COMPONENT_NAME,
                            file.originalName,
                            errorMessage,
                          );
                        }}
                      />
                    </div>
                  )}

                  {isText(file.mimeType) && textContent && (
                    <div className="bg-white/5">
                      <pre className="text-sm text-white p-4 overflow-auto whitespace-pre-wrap max-h-96">
                        {textContent}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                {getFileIcon(file.mimeType)}
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Preview not available
              </h3>
              <p className="text-gray-300 mb-6">
                This file type doesn&apos;t support preview. You can download it
                to view the content.
              </p>
              <button
                onClick={handleDownload}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download File
              </button>
            </div>
          )}
        </div>

        {/* File Details */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/20">
          <h3 className="text-sm font-medium text-white mb-3">File Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-300">File Name</dt>
              <dd className="text-white truncate" title={file.originalName}>
                {file.originalName}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-300">File Size</dt>
              <dd className="text-white">{formatFileSize(file.fileSize)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-300">File Type</dt>
              <dd className="text-white">{file.mimeType}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-300">Upload Date</dt>
              <dd className="text-white">{formatDate(file.uploadDate)}</dd>
            </div>
            {file.uploadedBy && (
              <div>
                <dt className="font-medium text-gray-300">Uploaded By</dt>
                <dd className="text-white">{file.uploadedBy}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-gray-300">File ID</dt>
              <dd className="text-white font-mono text-xs">{file.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
