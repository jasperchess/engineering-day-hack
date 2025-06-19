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

  // Load files from API
  useEffect(() => {
    const loadFiles = async () => {
      if (!session) return;
      
      try {
        setLoading(true);
        const response = await fetch("/api/files");

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch files');
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
        const processedFiles = filesArray.map((file: any) => ({
          ...file,
          uploadDate: new Date(file.uploadDate),
        }));

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
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete file');
        }
        
        const data = await response.json();
        if (data.success) {
          setFiles(prev => prev.filter(f => f.id !== fileId));
        } else {
          throw new Error(data.error || 'Failed to delete file');
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete file');
      }
    }
  };

  const handleBackToList = () => {
    setSelectedFile(null);
  };

  // If a file is selected, show the download/preview view
  if (selectedFile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">File Vault</h1>
                <nav className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={handleBackToList}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Files
                  </button>
                  <span className="text-gray-300">/</span>
                  <span className="text-blue-600 font-medium truncate max-w-xs">
                    {selectedFile.originalName}
                  </span>
                </nav>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href="/upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Upload Files
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="py-8">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">File Vault</h1>
              <nav className="flex items-center space-x-4 text-sm">
                <span className="text-blue-600 font-medium">Files</span>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
      <div className="py-8">
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
        <div className="fixed bottom-6 right-6">
          <a
            href="/upload"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
