import React, { useCallback, useEffect, useRef } from "react";
import { fileActivityLogger, FileActivity } from "./fileActivityLogger";

interface UseFileActivityLoggerOptions {
  componentName: string;
  enableAutoTracking?: boolean;
  trackPerformance?: boolean;
}

interface FileObject {
  id?: string;
  originalName?: string;
  name?: string;
  fileSize?: number;
  size?: number;
  mimeType?: string;
  type?: string;
  uploadStartTime?: number;
}

interface LogActivityOptions {
  files?: File[];
  file?: FileObject;
  fileName?: string;
  progress?: number;
  error?: Error | string;
  validationType?: string;
  message?: string;
  fileId?: string;
  previewType?: string;
  sortBy?: string;
  sortOrder?: string;
  fileCount?: number;
  filterType?: string;
  filterValue?: unknown;
  resultCount?: number;
  operation?: string;
  fileIds?: string[];
  success?: boolean;
  level?: string;
  userId?: string;
  details?: Record<string, unknown>;
}

interface FileActivityLoggerHook {
  logUploadStart: (files: File[]) => void;
  logUploadProgress: (fileName: string, progress: number) => void;
  logUploadComplete: (file: FileObject) => void;
  logUploadError: (fileName: string, error: Error | string) => void;
  logValidationError: (
    fileName: string,
    validationType: string,
    message: string,
  ) => void;
  logFileSelect: (file: FileObject) => void;
  logFileDownload: (file: FileObject) => void;
  logFileDelete: (fileId: string, fileName?: string) => void;
  logFilePreview: (file: FileObject, previewType: string) => void;
  logFileSort: (sortBy: string, sortOrder: string, fileCount: number) => void;
  logFileFilter: (
    filterType: string,
    filterValue: unknown,
    resultCount: number,
  ) => void;
  logBatchOperation: (
    operation: string,
    fileIds: string[],
    success: boolean,
  ) => void;
  logPerformanceMetric: (metric: string, value: number, unit: string) => void;
  logActivity: (activity: FileActivity, options?: LogActivityOptions) => void;
  startPerformanceTimer: (operation: string) => () => void;
}

export function useFileActivityLogger(
  options: UseFileActivityLoggerOptions,
): FileActivityLoggerHook {
  const {
    componentName,
    enableAutoTracking = true,
    trackPerformance = true,
  } = options;
  const performanceTimers = useRef<Map<string, number>>(new Map());
  const componentMountTime = useRef<number>(Date.now());

  // Log component mount/unmount if auto-tracking is enabled
  useEffect(() => {
    if (enableAutoTracking) {
      const mountTime = componentMountTime.current;
      fileActivityLogger.logPerformanceMetric(
        componentName,
        "component-mount",
        mountTime,
        "timestamp",
      );

      return () => {
        const unmountTime = Date.now();
        const mountDuration = unmountTime - mountTime;
        fileActivityLogger.logPerformanceMetric(
          componentName,
          "component-unmount",
          unmountTime,
          "timestamp",
        );
        fileActivityLogger.logPerformanceMetric(
          componentName,
          "component-lifetime",
          mountDuration,
          "milliseconds",
        );
      };
    }
  }, [componentName, enableAutoTracking]);

  const logUploadStart = useCallback(
    (files: File[]) => {
      fileActivityLogger.logUploadStart(componentName, files);
    },
    [componentName],
  );

  const logUploadProgress = useCallback(
    (fileName: string, progress: number) => {
      fileActivityLogger.logUploadProgress(componentName, fileName, progress);
    },
    [componentName],
  );

  const logUploadComplete = useCallback(
    (file: FileObject) => {
      fileActivityLogger.logUploadComplete(componentName, file);
    },
    [componentName],
  );

  const logUploadError = useCallback(
    (fileName: string, error: Error | string) => {
      fileActivityLogger.logUploadError(componentName, fileName, error);
    },
    [componentName],
  );

  const logValidationError = useCallback(
    (fileName: string, validationType: string, message: string) => {
      fileActivityLogger.logValidationError(
        componentName,
        fileName,
        validationType,
        message,
      );
    },
    [componentName],
  );

  const logFileSelect = useCallback(
    (file: FileObject) => {
      fileActivityLogger.logFileSelect(componentName, file);
    },
    [componentName],
  );

  const logFileDownload = useCallback(
    (file: FileObject) => {
      fileActivityLogger.logFileDownload(componentName, file);
    },
    [componentName],
  );

  const logFileDelete = useCallback(
    (fileId: string, fileName?: string) => {
      fileActivityLogger.logFileDelete(componentName, fileId, fileName);
    },
    [componentName],
  );

  const logFilePreview = useCallback(
    (file: FileObject, previewType: string) => {
      fileActivityLogger.logFilePreview(componentName, file, previewType);
    },
    [componentName],
  );

  const logFileSort = useCallback(
    (sortBy: string, sortOrder: string, fileCount: number) => {
      fileActivityLogger.logFileSort(
        componentName,
        sortBy,
        sortOrder,
        fileCount,
      );
    },
    [componentName],
  );

  const logFileFilter = useCallback(
    (filterType: string, filterValue: unknown, resultCount: number) => {
      fileActivityLogger.logFileFilter(
        componentName,
        filterType,
        filterValue,
        resultCount,
      );
    },
    [componentName],
  );

  const logBatchOperation = useCallback(
    (operation: string, fileIds: string[], success: boolean) => {
      fileActivityLogger.logBatchOperation(
        componentName,
        operation,
        fileIds,
        success,
      );
    },
    [componentName],
  );

  const logPerformanceMetric = useCallback(
    (metric: string, value: number, unit: string) => {
      if (trackPerformance) {
        fileActivityLogger.logPerformanceMetric(
          componentName,
          metric,
          value,
          unit,
        );
      }
    },
    [componentName, trackPerformance],
  );

  const logActivity = useCallback(
    (activity: FileActivity, options: LogActivityOptions = {}) => {
      // Use the public method instead of accessing private methods
      switch (activity) {
        case "upload_start":
          if (options.files) {
            fileActivityLogger.logUploadStart(componentName, options.files);
          }
          break;
        case "upload_progress":
          if (options.fileName && typeof options.progress === "number") {
            fileActivityLogger.logUploadProgress(
              componentName,
              options.fileName,
              options.progress,
            );
          }
          break;
        case "upload_complete":
          if (options.file) {
            fileActivityLogger.logUploadComplete(componentName, options.file);
          }
          break;
        case "upload_error":
          if (options.fileName && options.error) {
            fileActivityLogger.logUploadError(
              componentName,
              options.fileName,
              options.error,
            );
          }
          break;
        case "validation_error":
          if (options.fileName && options.validationType && options.message) {
            fileActivityLogger.logValidationError(
              componentName,
              options.fileName,
              options.validationType,
              options.message,
            );
          }
          break;
        case "file_select":
          if (options.file) {
            fileActivityLogger.logFileSelect(componentName, options.file);
          }
          break;
        case "file_download":
          if (options.file) {
            fileActivityLogger.logFileDownload(componentName, options.file);
          }
          break;
        case "file_delete":
          if (options.fileId) {
            fileActivityLogger.logFileDelete(
              componentName,
              options.fileId,
              options.fileName,
            );
          }
          break;
        case "file_preview":
          if (options.file && options.previewType) {
            fileActivityLogger.logFilePreview(
              componentName,
              options.file,
              options.previewType,
            );
          }
          break;
        case "file_sort":
          if (
            options.sortBy &&
            options.sortOrder &&
            typeof options.fileCount === "number"
          ) {
            fileActivityLogger.logFileSort(
              componentName,
              options.sortBy,
              options.sortOrder,
              options.fileCount,
            );
          }
          break;
        case "file_filter":
          if (options.filterType && typeof options.resultCount === "number") {
            fileActivityLogger.logFileFilter(
              componentName,
              options.filterType,
              options.filterValue,
              options.resultCount,
            );
          }
          break;
        case "batch_operation":
          if (
            options.operation &&
            options.fileIds &&
            typeof options.success === "boolean"
          ) {
            fileActivityLogger.logBatchOperation(
              componentName,
              options.operation,
              options.fileIds,
              options.success,
            );
          }
          break;
        default:
          console.warn(`Unknown activity type: ${activity}`);
      }
    },
    [componentName],
  );

  const startPerformanceTimer = useCallback(
    (operation: string) => {
      const startTime = Date.now();
      const timerKey = `${componentName}-${operation}-${startTime}`;
      performanceTimers.current.set(timerKey, startTime);

      logPerformanceMetric(`${operation}-start`, startTime, "timestamp");

      // Return a function to end the timer
      return () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        performanceTimers.current.delete(timerKey);

        logPerformanceMetric(`${operation}-duration`, duration, "milliseconds");
        logPerformanceMetric(`${operation}-end`, endTime, "timestamp");

        return duration;
      };
    },
    [componentName, logPerformanceMetric],
  );

  return {
    logUploadStart,
    logUploadProgress,
    logUploadComplete,
    logUploadError,
    logValidationError,
    logFileSelect,
    logFileDownload,
    logFileDelete,
    logFilePreview,
    logFileSort,
    logFileFilter,
    logBatchOperation,
    logPerformanceMetric,
    logActivity,
    startPerformanceTimer,
  };
}

// Higher-order component wrapper for automatic logging
export function withFileActivityLogger<P extends object>(
  WrappedComponent: React.ComponentType<P & WithFileActivityLoggerProps>,
  componentName: string,
  options: Omit<UseFileActivityLoggerOptions, "componentName"> = {},
): React.ComponentType<P> {
  const WithLoggingComponent: React.FC<P> = (props: P) => {
    const logger = useFileActivityLogger({ componentName, ...options });

    return React.createElement(WrappedComponent, {
      ...props,
      fileActivityLogger: logger,
    });
  };

  WithLoggingComponent.displayName = `withFileActivityLogger(${componentName})`;
  return WithLoggingComponent;
}

// Type for components that receive the logger as a prop
export interface WithFileActivityLoggerProps {
  fileActivityLogger?: FileActivityLoggerHook;
}

// Export types for external use
export type { FileObject, LogActivityOptions };
