"use client";

import React, { useState, useEffect, Suspense } from "react";
import FileList from "@/components/FileList";
import FileDownload from "@/components/FileDownload";
import Header from "@/components/Header";
import { FileItem } from "@/types/file";
import { useSession } from "@/app/auth/client";
import { useRouter, useSearchParams } from "next/navigation";

function FilesPageContent() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

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
        const searchQuery = searchParams.get("search");
        const url = searchQuery ? `/api/files?search=${encodeURIComponent(searchQuery)}` : "/api/files";
        const response = await fetch(url);

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

        // Check if we should auto-select a file based on URL parameter
        const fileId = searchParams.get("fileId");
        if (fileId) {
          const fileToSelect = processedFiles.find((f) => f.id === fileId);
          if (fileToSelect) {
            setSelectedFile(fileToSelect);
          }
        }
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
  }, [session, router, searchParams]);

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
    // Update URL to include fileId for deep linking
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("fileId", file.id);
    router.replace(newUrl.pathname + newUrl.search);
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
    // Remove fileId parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("fileId");
    router.replace(newUrl.pathname + newUrl.search);
  };

  // If a file is selected, show the download/preview view
  if (selectedFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 blur-3xl"></div>

        {/* Header */}
        <Header
          currentPage={selectedFile.originalName}
          showUploadButton={true}
          showSearchBar={true}
        />

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
      <Header currentPage="Files" showUploadButton={true} showSearchBar={true} />

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

export default function FilesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <FilesPageContent />
    </Suspense>
  );
}
