"use client";

import React, { useState, useEffect } from "react";
import { fileActivityLogger, FileActivityLog, FileActivityMetrics } from "@/utils/logging";

interface FileActivityDashboardProps {
  onClose?: () => void;
}

export default function FileActivityDashboard({ onClose }: FileActivityDashboardProps) {
  const [logs, setLogs] = useState<FileActivityLog[]>([]);
  const [metrics, setMetrics] = useState<FileActivityMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics' | 'export'>('logs');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterComponent, setFilterComponent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    const allLogs = fileActivityLogger.getLogs();
    setLogs(allLogs);
    setMetrics(fileActivityLogger.getMetrics());
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (filterActivity !== 'all' && log.activity !== filterActivity) return false;
    if (filterComponent !== 'all' && log.component !== filterComponent) return false;
    if (searchTerm && !log.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.component.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }).format(new Date(timestamp));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'upload_start':
      case 'upload_complete':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'file_download':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'upload_error':
      case 'validation_error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'file_preview':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      case 'file_delete':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const exportLogs = (format: 'json' | 'csv') => {
    const exportData = fileActivityLogger.exportLogs(format);
    const blob = new Blob([exportData], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file-activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      fileActivityLogger.clearLogs();
      refreshData();
    }
  };

  const uniqueComponents = [...new Set(logs.map(log => log.component))];
  const uniqueActivities = [...new Set(logs.map(log => log.activity))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">File Activity Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor file operations and performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'logs', label: 'Activity Logs', count: logs.length },
            { key: 'metrics', label: 'Metrics', count: null },
            { key: 'export', label: 'Export', count: null }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'logs' && (
            <div className="h-full flex flex-col">
              {/* Filters */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search files or components..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Activity</label>
                    <select
                      value={filterActivity}
                      onChange={(e) => setFilterActivity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Activities</option>
                      {uniqueActivities.map(activity => (
                        <option key={activity} value={activity}>
                          {activity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Component</label>
                    <select
                      value={filterComponent}
                      onChange={(e) => setFilterComponent(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Components</option>
                      {uniqueComponents.map(component => (
                        <option key={component} value={component}>{component}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Level</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Activity</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Component</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">File</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {getActivityIcon(log.activity)}
                            <span className="text-sm">
                              {log.activity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.component}</td>
                        <td className="px-4 py-3">
                          {log.fileName && (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 truncate max-w-32" title={log.fileName}>
                                {log.fileName}
                              </div>
                              {log.fileSize && (
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(log.fileSize)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.details && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                          {log.error && (
                            <div className="text-xs text-red-600 mt-1">
                              Error: {typeof log.error === 'string' ? log.error : log.error.message}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No logs found matching the current filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'metrics' && metrics && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900">Total Uploads</h3>
                  <p className="text-2xl font-bold text-blue-600">{metrics.totalUploads}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-900">Total Downloads</h3>
                  <p className="text-2xl font-bold text-green-600">{metrics.totalDownloads}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-900">Total Errors</h3>
                  <p className="text-2xl font-bold text-red-600">{metrics.totalErrors}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-900">Data Uploaded</h3>
                  <p className="text-2xl font-bold text-purple-600">{formatFileSize(metrics.uploadSizeTotal)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Common File Types</h3>
                  <div className="space-y-2">
                    {Object.entries(metrics.commonFileTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{type}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Errors by Type</h3>
                  <div className="space-y-2">
                    {Object.entries(metrics.errorsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-sm font-medium text-red-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Performance</h3>
                <p className="text-sm text-gray-600">
                  Average Upload Time: <span className="font-medium">{Math.round(metrics.averageUploadTime)}ms</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="p-6 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Logs</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Download file activity logs for analysis or archiving.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => exportLogs('json')}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export as JSON
                  </button>

                  <button
                    onClick={() => exportLogs('csv')}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export as CSV
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Logs</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Clear all logs from memory. This action cannot be undone.
                </p>

                <button
                  onClick={clearLogs}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  Clear All Logs
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Note about log persistence</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Logs are stored in memory and will be lost when the page is refreshed or the application is restarted.
                      Export logs regularly if you need to keep them for analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div
>
      </div>
    </div>
  );
}