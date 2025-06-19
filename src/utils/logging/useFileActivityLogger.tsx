"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { fileActivityLogger, FileActivity } from "./fileActivityLogger";

interface UseFileActivityLoggerOptions {
  componentName: string;
  enableAutoTracking?: boolean;
  trackPerformance?: boolean;
}

interface FileActivityLoggerHook {
  logUploadStart: (files: File[]) => void;
  logUploadProgress: (fileName: string, progress: number) => void;
  logUploadComplete: (file: any) => void;
  logUploadError: (fileName: string, error: Error | string) => void;
  logValidationError: (
    fileName: string,
    validationType: string,
    message: string,
  ) => void;
  logFileSelect: (file: any) => void;
  logFileDownload: (file: any) => void;
  logFileDelete: (fileId: string, fileName?: string) => void;
  logFilePreview: (file: any, previewType: string) => void;
  logFileSort: (sortBy: string, sortOrder: string, fileCount: number) => void;
  logFileFilter: (
    filterType: string,
    filterValue: any,
    resultCount: number,
  ) => void;
  logBatchOperation: (
    operation: string,
    fileIds: string[],
    success: boolean,
  ) => void;
  logPerformanceMetric: (metric: string, value: number, unit: string) => void;
  logActivity: (activity: FileActivity, options?: any) => void;
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
      fileActivityLogger.logPerformanceMetric(
        componentName,
        "component-mount",
        componentMountTime.current,
        "timestamp",
      );

      return () => {
        const unmountTime = Date.now();
        const mountDuration = unmountTime - componentMountTime.current;
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
    (file: any) => {
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
    (file: any) => {
      fileActivityLogger.logFileSelect(componentName, file);
    },
    [componentName],
  );

  const logFileDownload = useCallback(
    (file: any) => {
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
    (file: any, previewType: string) => {
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
    (filterType: string, filterValue: any, resultCount: number) => {
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
    (activity: FileActivity, options: any = {}) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        activity,
        level: options.level || "info",
        component: componentName,
        sessionId: fileActivityLogger["sessionId"], // Access private property
        userId: options.userId,
        fileId: options.fileId,
        fileName: options.fileName,
        fileSize: options.fileSize,
        fileType: options.fileType,
        details: options.details,
        error: options.error,
      };

      // Call the private addLog method
      (fileActivityLogger as any).addLog(logEntry);
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
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  options: Omit<UseFileActivityLoggerOptions, "componentName"> = {},
) {
  const WithLoggingComponent = (props: P) => {
    const logger = useFileActivityLogger({ componentName, ...options });

    return <WrappedComponent {...props} fileActivityLogger={logger} />;
  };

  WithLoggingComponent.displayName = `withFileActivityLogger(${componentName})`;
  return WithLoggingComponent;
}

// Type for components that receive the logger as a prop
export interface WithFileActivityLoggerProps {
  fileActivityLogger?: FileActivityLoggerHook;
}
