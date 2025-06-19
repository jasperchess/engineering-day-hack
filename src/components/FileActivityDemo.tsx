"use client";

import React, { useState } from "react";
import { useFileActivityLogger } from "@/utils/logging";
import FileActivityDashboard from "./FileActivityDashboard";

interface DemoFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export default function FileActivityDemo() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [files, setFiles] = useState<DemoFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const logger = useFileActivityLogger({
    componentName: "FileActivityDemo",
    enableAutoTracking: true,
    trackPerformance: true,
  });

  const simulateFileUpload = async (file: File) => {
    logger.logUploadStart([file]);

    const endTimer = logger.startPerformanceTimer("demo-upload");

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        logger.logUploadProgress(file.name, progress);
      }

      // Create demo file object
      const demoFile: DemoFile = {
        id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      setFiles(prev => [...prev, demoFile]);
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[file.name];
        return updated;
      });

      const duration = endTimer();
      logger.logUploadComplete({
        ...demoFile,
        uploadDuration: duration,
      });

      return demoFile;
    } catch (error) {
      logger.logUploadError(file.name, error instanceof Error ? error : String(error));
      endTimer();
      throw error;
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (const file of Array.from(selectedFiles)) {
      // Simulate file validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        logger.logValidationError(file.name, "size", "File too large (max 10MB)");
        continue;
      }

      if (!file.type.startsWith("image/") && !file.type.startsWith("text/")) {
        logger.logValidationError(file.name, "type", "Only images and text files allowed");
        continue;
      }

      try {
        await simulateFileUpload(file);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  };

  const handleFileSelect = (file: DemoFile) => {
    logger.logFileSelect(file);
    setSelectedFiles(prev =>
      prev.includes(file.id)
        ? prev.filter(id => id !== file.id)
        : [...prev, file.id]
    );
  };

  const handleFileDownload = (file: DemoFile) => {
    logger.logFileDownload(file);

    // Simulate download
    const blob = new Blob([`Demo content for ${file.name}`], { type: file.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileDelete = (file: DemoFile) => {
    logger.logFileDelete(file.id, file.name);
    setFiles(prev => prev.filter(f => f.id !== file.id));
    setSelectedFiles(prev => prev.filter(id => id !== file.id));
  };

  const handleFilePreview = (file: DemoFile) => {
    const previewType = file.type.startsWith("image/") ? "image" : "text";
    logger.logFilePreview(file, previewType);
    alert(`Preview for ${file.name}\nType: ${previewType}\nSize: ${file.size} bytes`);
  };

  const handleSort = (field: "name" | "size" | "type") => {
    logger.logFileSort(field, "asc", files.length);
    setFiles(prev => [...prev].sort((a, b) => {
      if (field === "size") return a.size - b.size;
      return a[field].localeCompare(b[field]);
    }));
  };

  const handleBatchDelete = () => {
    if (selectedFiles.length === 0) return;

    logger.logBatchOperation("bulk-delete", selectedFiles, true);
    setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">File Activity Logging Demo</h1>
            <p className="text-sm text-gray-500 mt-1">
              Interact with files to see logging in action
            </p>
          </div>
          <button
            onClick={() => setShowDashboard(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Activity Dashboard
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Files</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              Choose Files
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Upload images or text files (max 10MB each)
            </p>
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">{fileName}</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Files ({files.length})</h2>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => handleSort(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sort by...</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
              </select>
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Selected ({selectedFiles.length})
                </button>
              )}
            </div>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No files uploaded yet. Upload some files to see them here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    selectedFiles.includes(file.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFilePreview(file)}
                      className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleFileDownload(file)}
                      className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleFileDelete(file)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Dashboard */}
      {showDashboard && (
        <FileActivityDashboard onClose={() => setShowDashboard(false)} />
      )}

    </div>
  );
}