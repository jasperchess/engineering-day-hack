'use client';

import React, { useState, useEffect } from 'react';
import FileList from '@/components/FileList';
import FileDownload from '@/components/FileDownload';
import { FileItem } from '@/types/file';

// Mock data for demonstration
const mockFiles: FileItem[] = [
  {
    id: '1',
    filename: 'document1.pdf',
    originalName: 'Project Proposal.pdf',
    fileSize: 2048576, // 2MB
    fileType: 'pdf',
    mimeType: 'application/pdf',
    uploadDate: new Date('2024-01-15T10:30:00Z'),
    uploadedBy: 'john.doe@example.com',
    url: '/mock/files/document1.pdf'
  },
  {
    id: '2',
    filename: 'image1.jpg',
    originalName: 'Team Photo.jpg',
    fileSize: 1536000, // 1.5MB
    fileType: 'image',
    mimeType: 'image/jpeg',
    uploadDate: new Date('2024-01-14T15:45:00Z'),
    uploadedBy: 'jane.smith@example.com',
    url: '/mock/files/image1.jpg'
  },
  {
    id: '3',
    filename: 'spreadsheet1.xlsx',
    originalName: 'Budget Analysis Q1.xlsx',
    fileSize: 524288, // 512KB
    fileType: 'spreadsheet',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadDate: new Date('2024-01-13T09:15:00Z'),
    uploadedBy: 'alice.johnson@example.com',
    url: '/mock/files/spreadsheet1.xlsx'
  },
  {
    id: '4',
    filename: 'text1.txt',
    originalName: 'Meeting Notes.txt',
    fileSize: 8192, // 8KB
    fileType: 'text',
    mimeType: 'text/plain',
    uploadDate: new Date('2024-01-12T14:20:00Z'),
    uploadedBy: 'bob.wilson@example.com',
    url: '/mock/files/text1.txt'
  },
  {
    id: '5',
    filename: 'image2.png',
    originalName: 'Dashboard Screenshot.png',
    fileSize: 3072000, // 3MB
    fileType: 'image',
    mimeType: 'image/png',
    uploadDate: new Date('2024-01-11T11:00:00Z'),
    uploadedBy: 'charlie.brown@example.com',
    url: '/mock/files/image2.png'
  },
  {
    id: '6',
    filename: 'document2.docx',
    originalName: 'User Manual v2.docx',
    fileSize: 1048576, // 1MB
    fileType: 'document',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadDate: new Date('2024-01-10T16:30:00Z'),
    uploadedBy: 'diana.davis@example.com',
    url: '/mock/files/document2.docx'
  }
];

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Simulate API call to load files
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFiles(mockFiles);
      } catch (err) {
        setError('Failed to load files');
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleFileDownload = (file: FileItem) => {
    console.log('Downloading file:', file.originalName);
    // In a real app, this would trigger the actual download
    alert(`Downloading: ${file.originalName}`);
  };

  const handleFileDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        // Simulate API call to delete file
        await new Promise(resolve => setTimeout(resolve, 500));
        setFiles(prev => prev.filter(f => f.id !== fileId));
        console.log('File deleted:', fileId);
      } catch (err) {
        alert('Failed to delete file');
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload
          </a>
        </div>
      )}
    </div>
  );
}
