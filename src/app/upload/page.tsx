'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import { FileItem } from '@/types/file';
import { useSession } from '@/app/auth/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const handleUploadComplete = (file: FileItem) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleUploadError = (error: string) => {
    setUploadErrors(prev => [...prev, error]);
  };

  const clearErrors = () => {
    setUploadErrors([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">File Vault</h1>
              <nav className="flex items-center space-x-4 text-sm">
                <Link href="/files" className="text-gray-500 hover:text-gray-700">
                  Files
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-blue-600 font-medium">Upload</span>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <FileUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Upload Errors
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {uploadErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={clearErrors}
                      className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recently Uploaded Files
                </h2>
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.mimeType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href="/files"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View in Files
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} uploaded in this session
                    </p>
                    <Link
                      href="/files"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
