'use client';

import React, { useState, useCallback } from 'react';
import { FileUploadProgress, FileValidationError, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from '@/types/file';

interface FileUploadProps {
  onUploadComplete?: (file: any) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUpload({ onUploadComplete, onUploadError }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): FileValidationError | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        type: 'size',
        message: `File size must be less than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`,
        filename: file.name
      };
    }

    // Check file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type as any)) {
      return {
        type: 'type',
        message: 'Unsupported file type. Please upload images, PDFs, or documents.',
        filename: file.name
      };
    }

    return null;
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const errors: FileValidationError[] = [];
    const validFiles: File[] = [];

    // Validate all files
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setValidationErrors(errors);

    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Upload valid files
    for (const file of validFiles) {
      try {
        const progress: FileUploadProgress = {
          filename: file.name,
          progress: 0,
          status: 'uploading'
        };

        setUploadProgress(prev => [...prev, progress]);

        // Simulate upload progress (replace with actual API call)
        const formData = new FormData();
        formData.append('file', file);

        // Mock upload with progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev =>
            prev.map(p =>
              p.filename === file.name
                ? { ...p, progress: i }
                : p
            )
          );
        }

        // Mark as completed
        setUploadProgress(prev =>
          prev.map(p =>
            p.filename === file.name
              ? { ...p, status: 'completed', progress: 100 }
              : p
          )
        );

        onUploadComplete?.({
          id: Date.now().toString(),
          filename: file.name,
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type,
          mimeType: file.type,
          uploadDate: new Date(),
        });

      } catch (error) {
        setUploadProgress(prev =>
          prev.map(p =>
            p.filename === file.name
              ? { ...p, status: 'error', error: 'Upload failed' }
              : p
          )
        );
        onUploadError?.(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const clearProgress = () => {
    setUploadProgress([]);
    setValidationErrors([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Files</h2>

          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
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
                  className="w-12 h-12 text-gray-400"
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
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Support for images, PDFs, and documents up to {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-6 space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error.filename}
                      </h3>
                      <p className="text-sm text-red-700 mt-1">{error.message}</p>
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
                <h3 className="text-lg font-medium text-gray-900">Upload Progress</h3>
                {!isUploading && (
                  <button
                    onClick={clearProgress}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {uploadProgress.map((progress, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {progress.filename}
                      </span>
                      <div className="flex items-center space-x-2">
                        {progress.status === 'completed' && (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {progress.status === 'error' && (
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="text-sm text-gray-500">
                          {progress.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.status === 'completed'
                            ? 'bg-green-500'
                            : progress.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>

                    {progress.error && (
                      <p className="text-sm text-red-600 mt-2">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadProgress.some(p => p.status === 'completed') && !isUploading && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Upload Successful
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
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
