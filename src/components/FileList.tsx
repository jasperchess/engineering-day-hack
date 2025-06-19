"use client";

import React, { useState, useEffect } from "react";
import { FileItem } from "@/types/file";
import { fileActivityLogger } from "@/utils/logging";

interface FileListProps {
  files?: FileItem[];
  loading?: boolean;
  error?: string;
  onFileSelect?: (file: FileItem) => void;
  onFileDelete?: (fileId: string) => void;
  onFileDownload?: (file: FileItem) => void;
}

export default function FileList({
  files = [],
  loading = false,
  error,
  onFileSelect,
  onFileDelete,
  onFileDownload,
}: FileListProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const COMPONENT_NAME = "FileList";

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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return (
        <svg
          className="w-8 h-8 text-blue-500"
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
          className="w-8 h-8 text-red-500"
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
          className="w-8 h-8 text-blue-600"
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
          className="w-8 h-8 text-green-500"
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
          className="w-8 h-8 text-gray-500"
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

  const sortFiles = (files: FileItem[]) => {
    if (!files || files.length === 0) return [];
    return [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case "date":
          comparison =
            new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case "size":
          comparison = a.fileSize - b.fileSize;
          break;
        case "type":
          comparison = a.mimeType.localeCompare(b.mimeType);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const handleSort = (field: "name" | "date" | "size" | "type") => {
    const newSortOrder =
      sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "asc";

    fileActivityLogger.logFileSort(
      COMPONENT_NAME,
      field,
      newSortOrder,
      files.length,
    );

    if (sortBy === field) {
      setSortOrder(newSortOrder);
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    const isSelecting = !newSelection.has(fileId);

    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }

    fileActivityLogger.logPerformanceMetric(
      COMPONENT_NAME,
      isSelecting ? "file-selected" : "file-deselected",
      newSelection.size,
      "count",
    );

    setSelectedFiles(newSelection);
  };

  const sortedFiles = sortFiles(files);

  // Log component state changes
  useEffect(() => {
    if (loading) {
      fileActivityLogger.logPerformanceMetric(
        COMPONENT_NAME,
        "loading-state",
        1,
        "boolean",
      );
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      fileActivityLogger.logUploadError(
        COMPONENT_NAME,
        "component-error",
        error,
      );
    }
  }, [error]);

  useEffect(() => {
    fileActivityLogger.logPerformanceMetric(
      COMPONENT_NAME,
      "files-loaded",
      files.length,
      "count",
    );
  }, [files.length]);

  // Loading State
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Your Files</h2>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>

            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border border-white/20 rounded-lg">
                    <div className="w-8 h-8 bg-gray-600 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/6"></div>
                    </div>
                    <div className="w-16 h-4 bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Your Files
            </h2>
            <div className="bg-red-900/50 backdrop-blur-sm border border-red-500/50 rounded-md p-4">
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
                    Error Loading Files
                  </h3>
                  <p className="text-sm text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (files.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Your Files
            </h2>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">
                No files uploaded yet
              </h3>
              <p className="mt-1 text-sm text-gray-300">
                Get started by uploading your first file.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium inline-flex items-center"
                  onClick={() => (window.location.href = "/upload")}
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Files List
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Your Files</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                {files.length} {files.length === 1 ? "file" : "files"}
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-white/20">
            <span className="text-sm font-medium text-gray-300">Sort by:</span>
            {[
              { key: "name", label: "Name" },
              { key: "date", label: "Date" },
              { key: "size", label: "Size" },
              { key: "type", label: "Type" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() =>
                  handleSort(key as "name" | "date" | "size" | "type")
                }
                className={`text-sm px-3 py-1 rounded-md flex items-center space-x-1 ${
                  sortBy === key
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 border border-blue-400/30"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{label}</span>
                {sortBy === key && (
                  <svg
                    className={`w-4 h-4 transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Files Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className={`border border-white/20 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer backdrop-blur-sm ${
                  selectedFiles.has(file.id)
                    ? "ring-2 ring-blue-400 bg-blue-500/20"
                    : "hover:bg-white/5 bg-white/5"
                }`}
                onClick={() => {
                  fileActivityLogger.logFileSelect(COMPONENT_NAME, file);
                  onFileSelect?.(file);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-medium text-white truncate"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </h3>
                      <p className="text-xs text-gray-300 mt-1">
                        {formatDate(file.uploadDate)}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs text-gray-300">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span className="capitalize">
                          {file.mimeType.split("/")[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileActivityLogger.logFileDownload(
                          COMPONENT_NAME,
                          file,
                        );
                        onFileDownload?.(file);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors"
                      title="Download"
                    >
                      <svg
                        className="w-4 h-4"
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
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFileSelection(file.id);
                      }}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                      title="Select"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    {onFileDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileActivityLogger.logFileDelete(
                            COMPONENT_NAME,
                            file.id,
                            file.originalName,
                          );
                          onFileDelete(file.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Batch Actions */}
          {selectedFiles.size > 0 && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedFiles.size}{" "}
                  {selectedFiles.size === 1 ? "file" : "files"} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      fileActivityLogger.logBatchOperation(
                        COMPONENT_NAME,
                        "clear-selection",
                        Array.from(selectedFiles),
                        true,
                      );
                      setSelectedFiles(new Set());
                    }}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={() => {
                      fileActivityLogger.logBatchOperation(
                        COMPONENT_NAME,
                        "download-selected",
                        Array.from(selectedFiles),
                        true,
                      );
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-1 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm font-medium"
                  >
                    Download Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
