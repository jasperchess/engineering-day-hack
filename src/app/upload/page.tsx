"use client";

import React, { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import { FileItem } from "@/types/file";
import { useRouter } from "next/router";
import { useSession } from "../auth";
import Link from "next/link";

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const handleUploadComplete = (file: unknown) => {
    setUploadedFiles((prev) => [...prev, file as FileItem]);
  };

  const handleUploadError = (error: string) => {
    setUploadErrors((prev) => [...prev, error]);
  };

  const clearErrors = () => {
    setUploadErrors([]);
  };

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
                <a
                  href="/files"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Files
                </a>
                <span className="text-gray-500">/</span>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium">
                  Upload
                </span>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 relative z-10">
        <FileUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-red-900/50 backdrop-blur-sm border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start">
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
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-200">
                    Upload Errors
                  </h3>
                  <div className="mt-2 text-sm text-red-300">
                    <ul className="list-disc list-inside space-y-1">
                      {uploadErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={clearErrors}
                      className="text-sm bg-red-800/50 text-red-200 px-3 py-1 rounded hover:bg-red-700/50 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Recently Uploaded Files
                </h2>
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-8 h-8 text-green-400"
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
                        <div>
                          <p className="text-sm font-medium text-white">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-300">
                            {(file.fileSize / (1024 * 1024)).toFixed(2)} MB •{" "}
                            {file.mimeType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href="/files"
                          className="text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 font-medium"
                        >
                          View in Files
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-300">
                      {uploadedFiles.length}{" "}
                      {uploadedFiles.length === 1 ? "file" : "files"} uploaded
                      in this session
                    </p>
                    <Link
                      href="/files"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
                    >
                      View All Files
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
