'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface SharedFileData {
  success: boolean;
  file?: {
    id: string;
    filename: string;
    originalName: string;
    fileSize: number;
    fileType: string;
    mimeType: string;
    downloadUrl?: string;
    viewUrl?: string;
  };
  shareInfo?: {
    permissions: string;
    remainingDownloads?: number;
    expiresAt: string;
  };
  error?: string;
}

export default function SharedFilePage() {
  const params = useParams();
  const shareCode = params.code as string;
  const [fileData, setFileData] = useState<SharedFileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (shareCode) {
      fetchSharedFile();
    }
  }, [shareCode]);

  const fetchSharedFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shared/${shareCode}`);
      const data: SharedFileData = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load shared file');
        return;
      }

      setFileData(data);
    } catch (err) {
      setError('Failed to load shared file');
      console.error('Error fetching shared file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileData?.file?.downloadUrl || downloading) return;

    try {
      setDownloading(true);

      const response = await fetch(fileData.file.downloadUrl);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Refresh file data to update remaining downloads
      await fetchSharedFile();
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getRemainingTime = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = expiry - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
    }

    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const getFileIcon = (fileType: string, mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊';
    } else if (mimeType.startsWith('text/')) {
      return '📄';
    }
    return '📎';
  };

  const canDownload = fileData?.shareInfo?.permissions === 'download' ||
                     fileData?.shareInfo?.permissions === 'both';
  const canView = fileData?.shareInfo?.permissions === 'view' ||
                 fileData?.shareInfo?.permissions === 'both';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared file...</p>
        </div>
      </div>
    );
  }

  if (error || !fileData?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">File Not Available</h1>
          <p className="text-gray-600 mb-6">
            {error || 'This shared file is no longer available or has expired.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const { file, shareInfo } = fileData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared File</h1>
          <p className="text-gray-600">Someone has shared a file with you</p>
        </div>

        {/* File Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* File Header */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">
                {getFileIcon(file!.fileType, file!.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {file!.originalName}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file!.fileSize)} • {file!.fileType}
                </p>
              </div>
            </div>
          </div>

          {/* File Content/Preview */}
          <div className="px-6 py-6">
            {file!.mimeType.startsWith('image/') && canView && (
              <div className="mb-6">
                <img
                  src={file!.viewUrl}
                  alt={file!.originalName}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}

            {file!.mimeType.startsWith('text/') && canView && (
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm text-gray-600 mb-2">Text file preview:</p>
                  <div className="bg-white rounded border p-3 max-h-48 overflow-y-auto">
                    <iframe
                      src={file!.viewUrl}
                      className="w-full h-32 border-0"
                      title="File preview"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Share Information */}
            {shareInfo && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Share Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Permissions:</span>
                    <div className="capitalize text-blue-600">
                      {shareInfo.permissions === 'both' ? 'View & Download' : shareInfo.permissions}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Expires:</span>
                    <div className="text-blue-600">
                      {getRemainingTime(shareInfo.expiresAt)}
                    </div>
                  </div>
                  {shareInfo.remainingDownloads !== undefined && (
                    <div>
                      <span className="text-blue-700 font-medium">Downloads:</span>
                      <div className="text-blue-600">
                        {shareInfo.remainingDownloads} remaining
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {canDownload && (
                <button
                  onClick={handleDownload}
                  disabled={downloading || (shareInfo?.remainingDownloads === 0)}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download File
                    </>
                  )}
                </button>
              )}

              {canView && file!.viewUrl && (
                <a
                  href={file!.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View File
                </a>
              )}
            </div>

            {/* Warning Messages */}
            {shareInfo?.remainingDownloads === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    Download limit reached. This file can no longer be downloaded.
                  </p>
                </div>
              </div>
            )}

            {new Date(shareInfo?.expiresAt || '').getTime() - new Date().getTime() < 3600000 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-orange-800">
                    This link will expire soon. Download the file if you need it.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go to File Vault AI
          </Link>
        </div>
      </div>
    </div>
  );
}
