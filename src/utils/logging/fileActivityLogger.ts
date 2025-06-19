export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type FileActivity =
  | 'upload_start'
  | 'upload_progress'
  | 'upload_complete'
  | 'upload_error'
  | 'validation_error'
  | 'file_select'
  | 'file_download'
  | 'file_delete'
  | 'file_preview'
  | 'file_sort'
  | 'file_filter'
  | 'batch_operation';

export interface FileActivityLog {
  timestamp: string;
  activity: FileActivity;
  level: LogLevel;
  component: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
  sessionId?: string;
  details?: Record<string, any>;
  error?: Error | string;
}

export interface FileActivityMetrics {
  totalUploads: number;
  totalDownloads: number;
  totalErrors: number;
  uploadSizeTotal: number;
  averageUploadTime: number;
  commonFileTypes: Record<string, number>;
  errorsByType: Record<string, number>;
}

class FileActivityLogger {
  private logs: FileActivityLog[] = [];
  private maxLogs: number = 1000;
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();

    // Check if logging is enabled (could be controlled by env var)
    this.isEnabled = process.env.NODE_ENV !== 'production' ||
                     process.env.NEXT_PUBLIC_ENABLE_FILE_LOGGING === 'true';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // This would typically get the current user ID from auth context
    // For now, we'll use a placeholder or session storage
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('userId') || undefined;
    }
    return undefined;
  }

  private createLogEntry(
    activity: FileActivity,
    level: LogLevel,
    component: string,
    options: Partial<FileActivityLog> = {}
  ): FileActivityLog {
    return {
      timestamp: new Date().toISOString(),
      activity,
      level,
      component,
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      ...options
    };
  }

  private addLog(log: FileActivityLog): void {
    if (!this.isEnabled) return;

    this.logs.push(log);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to console in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = log.level === 'error' ? console.error :
                       log.level === 'warn' ? console.warn :
                       log.level === 'debug' ? console.debug :
                       console.log;

      logMethod(`[FileActivity] ${log.component}: ${log.activity}`, log);
    }

    // In production, you might want to send logs to an external service
    if (process.env.NODE_ENV === 'production' && this.isEnabled) {
      this.sendToExternalService(log);
    }
  }

  private async sendToExternalService(log: FileActivityLog): Promise<void> {
    try {
      // This would send logs to your preferred logging service
      // Examples: DataDog, LogRocket, Sentry, etc.
      if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log)
        });
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  // File Upload Logging
  logUploadStart(component: string, files: File[]): void {
    files.forEach(file => {
      this.addLog(this.createLogEntry('upload_start', 'info', component, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        details: {
          fileCount: files.length,
          totalSize: files.reduce((sum, f) => sum + f.size, 0)
        }
      }));
    });
  }

  logUploadProgress(component: string, fileName: string, progress: number): void {
    this.addLog(this.createLogEntry('upload_progress', 'debug', component, {
      fileName,
      details: { progress }
    }));
  }

  logUploadComplete(component: string, file: any): void {
    this.addLog(this.createLogEntry('upload_complete', 'info', component, {
      fileId: file.id,
      fileName: file.originalName || file.name,
      fileSize: file.fileSize || file.size,
      fileType: file.mimeType || file.type,
      details: {
        uploadDuration: Date.now() - (file.uploadStartTime || Date.now()),
        success: true
      }
    }));
  }

  logUploadError(component: string, fileName: string, error: Error | string): void {
    this.addLog(this.createLogEntry('upload_error', 'error', component, {
      fileName,
      error,
      details: {
        errorMessage: typeof error === 'string' ? error : error.message,
        errorStack: typeof error === 'object' ? error.stack : undefined
      }
    }));
  }

  // File Validation Logging
  logValidationError(component: string, fileName: string, validationType: string, message: string): void {
    this.addLog(this.createLogEntry('validation_error', 'warn', component, {
      fileName,
      details: {
        validationType,
        validationMessage: message
      }
    }));
  }

  // File Selection Logging
  logFileSelect(component: string, file: any): void {
    this.addLog(this.createLogEntry('file_select', 'info', component, {
      fileId: file.id,
      fileName: file.originalName || file.name,
      fileType: file.mimeType || file.type,
      fileSize: file.fileSize || file.size
    }));
  }

  // File Download Logging
  logFileDownload(component: string, file: any): void {
    this.addLog(this.createLogEntry('file_download', 'info', component, {
      fileId: file.id,
      fileName: file.originalName || file.name,
      fileType: file.mimeType || file.type,
      fileSize: file.fileSize || file.size,
      details: {
        downloadTime: new Date().toISOString()
      }
    }));
  }

  // File Delete Logging
  logFileDelete(component: string, fileId: string, fileName?: string): void {
    this.addLog(this.createLogEntry('file_delete', 'info', component, {
      fileId,
      fileName,
      details: {
        deleteTime: new Date().toISOString()
      }
    }));
  }

  // File Preview Logging
  logFilePreview(component: string, file: any, previewType: string): void {
    this.addLog(this.createLogEntry('file_preview', 'info', component, {
      fileId: file.id,
      fileName: file.originalName || file.name,
      fileType: file.mimeType || file.type,
      details: {
        previewType,
        previewTime: new Date().toISOString()
      }
    }));
  }

  // File Sorting/Filtering Logging
  logFileSort(component: string, sortBy: string, sortOrder: string, fileCount: number): void {
    this.addLog(this.createLogEntry('file_sort', 'debug', component, {
      details: {
        sortBy,
        sortOrder,
        fileCount
      }
    }));
  }

  logFileFilter(component: string, filterType: string, filterValue: any, resultCount: number): void {
    this.addLog(this.createLogEntry('file_filter', 'debug', component, {
      details: {
        filterType,
        filterValue,
        resultCount
      }
    }));
  }

  // Batch Operations Logging
  logBatchOperation(component: string, operation: string, fileIds: string[], success: boolean): void {
    this.addLog(this.createLogEntry('batch_operation', success ? 'info' : 'error', component, {
      details: {
        operation,
        fileIds,
        fileCount: fileIds.length,
        success,
        timestamp: new Date().toISOString()
      }
    }));
  }

  // Performance Logging
  logPerformanceMetric(component: string, metric: string, value: number, unit: string): void {
    this.addLog(this.createLogEntry('upload_progress', 'debug', component, {
      details: {
        performanceMetric: metric,
        value,
        unit,
        timestamp: new Date().toISOString()
      }
    }));
  }

  // Utility Methods
  getLogs(activity?: FileActivity, component?: string, limit?: number): FileActivityLog[] {
    let filteredLogs = this.logs;

    if (activity) {
      filteredLogs = filteredLogs.filter(log => log.activity === activity);
    }

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getMetrics(): FileActivityMetrics {
    const uploadLogs = this.logs.filter(log => log.activity === 'upload_complete');
    const downloadLogs = this.logs.filter(log => log.activity === 'file_download');
    const errorLogs = this.logs.filter(log => log.level === 'error');

    const commonFileTypes: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    uploadLogs.forEach(log => {
      if (log.fileType) {
        commonFileTypes[log.fileType] = (commonFileTypes[log.fileType] || 0) + 1;
      }
    });

    errorLogs.forEach(log => {
      const errorType = log.activity;
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    const totalUploadSize = uploadLogs.reduce((sum, log) => sum + (log.fileSize || 0), 0);
    const totalUploadTime = uploadLogs.reduce((sum, log) => {
      const duration = log.details?.uploadDuration || 0;
      return sum + duration;
    }, 0);

    return {
      totalUploads: uploadLogs.length,
      totalDownloads: downloadLogs.length,
      totalErrors: errorLogs.length,
      uploadSizeTotal: totalUploadSize,
      averageUploadTime: uploadLogs.length > 0 ? totalUploadTime / uploadLogs.length : 0,
      commonFileTypes,
      errorsByType
    };
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp', 'activity', 'level', 'component', 'fileId',
        'fileName', 'fileSize', 'fileType', 'userId', 'sessionId'
      ];

      const csvRows = [
        headers.join(','),
        ...this.logs.map(log =>
          headers.map(header =>
            log[header as keyof FileActivityLog] || ''
          ).join(',')
        )
      ];

      return csvRows.join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs(): void {
    this.logs = [];
  }

  setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
  }

  enableLogging(): void {
    this.isEnabled = true;
  }

  disableLogging(): void {
    this.isEnabled = false;
  }
}

// Export singleton instance
export const fileActivityLogger = new FileActivityLogger();

// Export the
 class for custom instances if needed
export { FileActivityLogger };