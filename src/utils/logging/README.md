# File Activity Logging System

A comprehensive logging system for tracking file operations and user interactions in React components. This system provides detailed insights into file uploads, downloads, validations, and user behavior patterns.

## Features

- **Comprehensive Activity Tracking**: Upload, download, preview, delete, and validation events
- **Performance Monitoring**: Track timing metrics and component performance
- **Real-time Dashboard**: Visual interface for monitoring file activities
- **Export Capabilities**: Export logs in JSON or CSV format
- **Filtering & Search**: Advanced filtering options for log analysis
- **React Integration**: Easy-to-use hooks and HOCs for React components
- **Error Tracking**: Detailed error logging with stack traces
- **Session Management**: Track user sessions and activities

## Quick Start

### 1. Basic Usage with Hook

```typescript
import { useFileActivityLogger } from '@/utils/logging';

function MyFileComponent() {
  const logger = useFileActivityLogger({
    componentName: 'MyFileComponent',
    enableAutoTracking: true,
    trackPerformance: true
  });

  const handleFileUpload = async (files: File[]) => {
    logger.logUploadStart(files);
    
    try {
      // Your upload logic here
      const result = await uploadFiles(files);
      logger.logUploadComplete(result);
    } catch (error) {
      logger.logUploadError(files[0].name, error);
    }
  };

  return (
    // Your component JSX
  );
}
```

### 2. Direct Logger Usage

```typescript
import { fileActivityLogger } from '@/utils/logging';

// Log file upload
fileActivityLogger.logUploadStart('FileUpload', files);
fileActivityLogger.logUploadComplete('FileUpload', uploadedFile);

// Log file operations
fileActivityLogger.logFileDownload('FileList', file);
fileActivityLogger.logFileDelete('FileList', fileId, fileName);

// Log performance metrics
fileActivityLogger.logPerformanceMetric('FileUpload', 'upload-duration', 1500, 'milliseconds');
```

### 3. Using the Dashboard

```typescript
import { FileActivityDashboard } from '@/components/FileActivityDashboard';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div>
      <button onClick={() => setShowDashboard(true)}>
        Show Activity Dashboard
      </button>
      
      {showDashboard && (
        <FileActivityDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}
```

## API Reference

### useFileActivityLogger Hook

#### Parameters

```typescript
interface UseFileActivityLoggerOptions {
  componentName: string;           // Name of the component for logging
  enableAutoTracking?: boolean;    // Auto-track component lifecycle (default: true)
  trackPerformance?: boolean;      // Enable performance tracking (default: true)
}
```

#### Returns

```typescript
interface FileActivityLoggerHook {
  logUploadStart: (files: File[]) => void;
  logUploadProgress: (fileName: string, progress: number) => void;
  logUploadComplete: (file: any) => void;
  logUploadError: (fileName: string, error: Error | string) => void;
  logValidationError: (fileName: string, validationType: string, message: string) => void;
  logFileSelect: (file: any) => void;
  logFileDownload: (file: any) => void;
  logFileDelete: (fileId: string, fileName?: string) => void;
  logFilePreview: (file: any, previewType: string) => void;
  logFileSort: (sortBy: string, sortOrder: string, fileCount: number) => void;
  logFileFilter: (filterType: string, filterValue: any, resultCount: number) => void;
  logBatchOperation: (operation: string, fileIds: string[], success: boolean) => void;
  logPerformanceMetric: (metric: string, value: number, unit: string) => void;
  startPerformanceTimer: (operation: string) => () => void;
}
```

### FileActivityLogger Class

#### Core Methods

```typescript
// Upload tracking
logUploadStart(component: string, files: File[]): void
logUploadProgress(component: string, fileName: string, progress: number): void
logUploadComplete(component: string, file: any): void
logUploadError(component: string, fileName: string, error: Error | string): void

// File operations
logFileSelect(component: string, file: any): void
logFileDownload(component: string, file: any): void
logFileDelete(component: string, fileId: string, fileName?: string): void
logFilePreview(component: string, file: any, previewType: string): void

// Validation
logValidationError(component: string, fileName: string, validationType: string, message: string): void

// User interactions
logFileSort(component: string, sortBy: string, sortOrder: string, fileCount: number): void
logFileFilter(component: string, filterType: string, filterValue: any, resultCount: number): void
logBatchOperation(component: string, operation: string, fileIds: string[], success: boolean): void

// Performance
logPerformanceMetric(component: string, metric: string, value: number, unit: string): void
```

#### Utility Methods

```typescript
// Get logs with optional filtering
getLogs(activity?: FileActivity, component?: string, limit?: number): FileActivityLog[]

// Get aggregated metrics
getMetrics(): FileActivityMetrics

// Export logs
exportLogs(format: 'json' | 'csv'): string

// Management
clearLogs(): void
setMaxLogs(max: number): void
enableLogging(): void
disableLogging(): void
```

## Log Types

### FileActivity Types

```typescript
type FileActivity =
  | 'upload_start'      // File upload initiated
  | 'upload_progress'   // Upload progress update
  | 'upload_complete'   // Upload completed successfully
  | 'upload_error'      // Upload failed
  | 'validation_error'  // File validation failed
  | 'file_select'       // File selected by user
  | 'file_download'     // File download initiated
  | 'file_delete'       // File deleted
  | 'file_preview'      // File preview opened
  | 'file_sort'         // File list sorted
  | 'file_filter'       // File list filtered
  | 'batch_operation';  // Batch operation performed
```

### Log Levels

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

### FileActivityLog Structure

```typescript
interface FileActivityLog {
  timestamp: string;                    // ISO timestamp
  activity: FileActivity;               // Type of activity
  level: LogLevel;                      // Log level
  component: string;                    // Component name
  fileId?: string;                      // File identifier
  fileName?: string;                    // File name
  fileSize?: number;                    // File size in bytes
  fileType?: string;                    // MIME type
  userId?: string;                      // User identifier
  sessionId?: string;                   // Session identifier
  details?: Record<string, any>;        // Additional details
  error?: Error | string;               // Error information
}
```

## Configuration

### Environment Variables

```bash
# Enable logging in production (default: disabled)
NEXT_PUBLIC_ENABLE_FILE_LOGGING=true

# External logging service endpoint
NEXT_PUBLIC_LOGGING_ENDPOINT=https://your-logging-service.com/api/logs
```

### Customization

```typescript
// Create custom logger instance
const customLogger = new FileActivityLogger();
customLogger.setMaxLogs(5000);
customLogger.enableLogging();

// Configure for specific component
const logger = useFileActivityLogger({
  componentName: 'AdvancedFileUpload',
  enableAutoTracking: false,  // Disable auto-tracking
  trackPerformance: true      // Keep performance tracking
});
```

## Advanced Usage

### Performance Timing

```typescript
const logger = useFileActivityLogger({ componentName: 'FileUpload' });

const handleUpload = async (files: File[]) => {
  const endTimer = logger.startPerformanceTimer('file-upload');
  
  try {
    await uploadFiles(files);
    const duration = endTimer(); // Returns duration in ms
    console.log(`Upload took ${duration}ms`);
  } catch (error) {
    endTimer(); // Still end timer on error
    throw error;
  }
};
```

### Custom Activity Logging

```typescript
const logger = useFileActivityLogger({ componentName: 'CustomComponent' });

logger.logActivity('custom_activity', {
  level: 'info',
  fileName: 'document.pdf',
  details: {
    customField: 'value',
    timestamp: Date.now()
  }
});
```

### Batch Operations Tracking

```typescript
const selectedFiles = ['file1', 'file2', 'file3'];

try {
  await deleteMultipleFiles(selectedFiles);
  logger.logBatchOperation('bulk-delete', selectedFiles, true);
} catch (error) {
  logger.logBatchOperation('bulk-delete', selectedFiles, false);
}
```

## Dashboard Features

### Real-time Monitoring
- Live log updates every 5 seconds
- Real-time activity feed
- Component performance metrics

### Filtering Options
- Filter by log level (debug, info, warn, error)
- Filter by activity type
- Filter by component
- Text search across file names and components

### Metrics Dashboard
- Total uploads/downloads
- Error counts and types
- File type distribution
- Performance averages
- Data transfer volumes

### Export Options
- JSON export for programmatic analysis
- CSV export for spreadsheet analysis
- Configurable date ranges
- Filtered exports

## Best Practices

### 1. Component Integration

```typescript
// ✅ Good: Use descriptive component names
const logger = useFileActivityLogger({ 
  componentName: 'UserFileUploadModal' 
});

// ❌ Avoid: Generic names
const logger = useFileActivityLogger({ 
  componentName: 'Component' 
});
```

### 2. Error Handling

```typescript
// ✅ Good: Log errors with context
try {
  await uploadFile(file);
} catch (error) {
  logger.logUploadError(file.name, error);
  logger.logPerformanceMetric('upload-failure-rate', 1, 'count');
  throw error; // Re-throw for component handling
}
```

### 3. Performance Tracking

```typescript
// ✅ Good: Track meaningful metrics
logger.logPerformanceMetric('files-processed-per-second', rate, 'rate');
logger.logPerformanceMetric('memory-usage', memoryUsed, 'bytes');

// ❌ Avoid: Excessive granular tracking
// Don't log every mouse move or trivial interaction
```

### 4. Privacy Considerations

```typescript
// ✅ Good: Log file metadata, not content
logger.logFileSelect({
  id: file.id,
  name: file.name,
  size: file.size,
  type: file.type
});

// ❌ Avoid: Logging sensitive data
// Don't log file contents, personal information, or API keys
```

## Troubleshooting

### Common Issues

1. **Logs not appearing in dashboard**
   - Check if logging is enabled: `fileActivityLogger.isEnabled`
   - Verify component names match between logger and dashboard
   - Ensure dashboard is refreshing (auto-refresh every 5s)

2. **Performance impact**
   - Disable debug logging in production
   - Reduce `maxLogs` limit for memory-constrained environments
   - Use `trackPerformance: false` for high-frequency components

3. **Missing logs**
   - Check browser console for errors
   - Verify external logging endpoint is accessible (if configured)
   - Ensure proper error handling doesn't prevent logging

### Debugging

```typescript
// Check logger status
console.log('Logger enabled:', fileActivityLogger.isEnabled);
console.log('Current logs:', fileActivityLogger.getLogs().length);
console.log('Metrics:', fileActivityLogger.getMetrics());

// Enable debug mode
process.env.NODE_ENV = 'development';
```

## Contributing

When adding new logging functionality:

1. Follow the existing naming conventions
2. Add appropriate TypeScript types
3. Update this documentation
4. Test in both development and production modes
5. Consider privacy implications

## License

This logging system is part of the Engineering Day Hack project and follows the same license terms.