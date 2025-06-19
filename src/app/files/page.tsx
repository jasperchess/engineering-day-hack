"use client";

import React, { useState, useEffect } from "react";
import FileList from "@/components/FileList";
import FileDownload from "@/components/FileDownload";
import { FileItem } from "@/types/file";
import { useSession } from "@/app/auth/client";
import { useRouter } from "next/navigation";

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const loadFiles = async () => {
      if (!session) return;

      try {
        setLoading(true);
        const response = await fetch("/api/files");

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch files");
        }

        const data = await response.json();

        // Handle different response formats and convert dates
        let filesArray: FileItem[] = [];
        if (Array.isArray(data)) {
          filesArray = data;
        } else if (data && Array.isArray(data.files)) {
          filesArray = data.files;
        } else if (data && data.success && Array.isArray(data.files)) {
          filesArray = data.files;
        } else {
          throw new Error("Invalid response format from API");
        }

        // Convert date strings to Date objects
        const processedFiles = filesArray.map(
          (file: FileItem & { uploadDate: string | Date }) => ({
            ...file,
            uploadDate: new Date(file.uploadDate),
          }),
        );

        setFiles(processedFiles);
      } catch (err) {
        console.error("Error loading files:", err);
        setError(err instanceof Error ? err.message : "Failed to load files");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      loadFiles();
    }
  }, [session, router]);

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  // Load files from API

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleFileDownload = (file: FileItem) => {
    console.log("Downloading file:", file.originalName);
    // In a real app, this would trigger the actual download
    alert(`Downloading: ${file.originalName}`);
  };

  const handleFileDelete = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        const response = await fetch(`/api/files/${fileId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete file");
        }

        const data = await response.json();
        if (data.success) {
          setFiles((prev) => prev.filter((f) => f.id !== fileId));
        } else {
          throw new Error(data.error || "Failed to delete file");
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete file");
      }
    }
  };

  const handleBackToList = () => {
    setSelectedFile(null);
  };

  // If a file is selected, show the download/preview view
  if (selectedFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 blur-3xl"></div>

        {/* Header */}
        <div className="relative z-10 backdrop-blur-sm bg-white/10 border-b border-white/20">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-white text-xl font-bold">
                    File Vault
                  </span>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent text-sm font-semibold">
                    AI
                  </span>
                </div>
                <nav className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={handleBackToList}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Files
                  </button>
                  <span className="text-gray-500">/</span>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium truncate max-w-xs">
                    {selectedFile.originalName}
                  </span>
                </nav>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href="/upload"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
                >
                  Upload Files
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="py-8 relative z-10">
          <FileDownload
            file={selectedFile}
            onDownload={handleFileDownload}
            onBack={handleBackToList}
          />
        </div>
      </div>
    );
  }

  // Show the files list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 blur-3xl"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>

      {/* Header */}
      <div className="relative z-10 backdrop-blur-sm bg-white/10 border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-white text-xl font-bold">File Vault</span>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent text-sm font-semibold">
                  AI
                </span>
              </div>
              <nav className="flex items-center space-x-4 text-sm">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium">
                  Files
                </span>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="/upload"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Upload Files
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 relative z-10">
        <FileList
          files={files}
          loading={loading}
          error={error}
          onFileSelect={handleFileSelect}
          onFileDelete={handleFileDelete}
          onFileDownload={handleFileDownload}
        />
      </div>

      {/* Quick Actions Footer */}
      {!loading && files.length > 0 && (
        <div className="fixed bottom-6 right-6 z-20">
          <a
            href="/upload"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 font-medium inline-flex items-center backdrop-blur-sm"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Upload
          </a>
        </div>
      )}
    </div>
  );
}
