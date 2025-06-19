# File Upload Security System

This document outlines the comprehensive security measures implemented to protect against malicious file uploads and prevent attacks on the File Vault AI system.

## Overview

The application implements multiple layers of security validation to prevent file size spoofing, oversized uploads, and other file-based attacks.

## Security Layers

### 1. Client-Side Validation (First Layer)
- **Location**: `src/types/file.ts` and client components
- **Purpose**: Immediate user feedback and basic filtering
- **Limitations**: Can be bypassed by attackers
- **Implementation**: 
  - File size check against `MAX_FILE_SIZE` (10MB)
  - File type validation against `SUPPORTED_FILE_TYPES`

### 2. HTTP Middleware Validation (Second Layer)
- **Location**: `middleware.ts` and `src/utils/uploadMiddleware.ts`
- **Purpose**: Early request termination before processing
- **Features**:
  - Content-Length header validation
  - Immediate 413 (Payload Too Large) response for oversized requests
  - Connection termination to prevent bandwidth waste
  - Security headers injection

### 3. Stream Validation (Third Layer)
- **Location**: `src/utils/fileUtils.ts` - `validateFileStream()`
- **Purpose**: Validate actual file content during upload
- **Features**:
  - Real-time byte counting during file streaming
  - Upload termination if size exceeds limits
  - Detection of file header spoofing
  - Comparison between claimed size and actual size

### 4. Save-Time Validation (Fourth Layer)
- **Location**: `src/utils/fileUtils.ts` - `saveFile()`
- **Purpose**: Final validation during file system write
- **Features**:
  - Stream-based file writing with size monitoring
  - Automatic cleanup of partial files on failure
  - Defense-in-depth validation

## Configuration

### File Size Limits
```typescript
// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### Supported File Types
```typescript
export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
```

## Security Headers

The system applies the following security headers to file upload endpoints:

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Cache-Control: no-store, no-cache, must-revalidate` - Prevents caching of sensitive upload responses

## Attack Prevention

### File Size Spoofing
**Attack**: Attacker sends a small Content-Length header but uploads a large file
**Protection**: 
1. Middleware validates Content-Length if present
2. Stream validation counts actual bytes during upload
3. Upload is terminated immediately when size limit is exceeded
4. Mismatch detection between claimed and actual file size

### Oversized Upload DoS
**Attack**: Attacker attempts to overwhelm server with large files
**Protection**:
1. Early termination at middleware level
2. Connection closure to prevent bandwidth waste
3. Rate limiting on upload endpoints
4. Stream-based processing to limit memory usage

### Malicious File Types
**Attack**: Attacker uploads executable or dangerous file types
**Protection**:
1. Strict whitelist of allowed MIME types
2. File extension validation
3. Content-Type header validation

### Memory Exhaustion
**Attack**: Large files causing server memory issues
**Protection**:
1. Stream-based file processing (no full buffering)
2. Chunked reading and writing
3. Immediate cleanup of failed uploads

## Error Responses

### 413 Payload Too Large
Returned when:
- Content-Length exceeds maximum allowed size
- Actual file size exceeds limit during streaming
- File validation fails due to size constraints

### 400 Bad Request
Returned when:
- Invalid file type
- Missing file in request
- File header spoofing detected

### 429 Too Many Requests
Returned when:
- Rate limit exceeded for uploads
- Includes retry-after information

## Best Practices

### For Developers
1. Always use `validateFileStream()` instead of basic `validateFile()` for server-side validation
2. Handle file streams properly and clean up resources
3. Log security events for monitoring
4. Test with various file sizes and types

### For Operations
1. Monitor upload patterns for suspicious activity
2. Set up alerts for repeated 413 errors from same IP
3. Regularly review file upload logs
4. Consider implementing IP-based rate limiting

## Testing Security

To test the security system:

1. **Size Spoofing Test**: Create a small file, modify Content-Length header to claim larger size
2. **Oversized Upload Test**: Attempt to upload files larger than 10MB
3. **Invalid Type Test**: Try uploading executable files or unsupported formats
4. **Rate Limit Test**: Perform multiple rapid uploads from same client

## Configuration Options

### Next.js Configuration
```typescript
// next.config.ts
api: {
  bodyParser: {
    sizeLimit: "10mb",
  },
}
```

### Environment Variables
- `MAX_UPLOAD_SIZE`: Override default file size limit
- `UPLOAD_RATE_LIMIT`: Configure rate limiting parameters

## Monitoring and Alerts

Key metrics to monitor:
- Upload success/failure rates
- 413 error frequency
- File size distribution
- Upload duration patterns
- Rate limit violations

## Security Considerations

1. **Network Level**: Consider implementing additional DDoS protection
2. **File Scanning**: Consider adding virus/malware scanning for uploaded files
3. **Storage**: Ensure uploaded files are stored outside web root
4. **Access Control**: Implement proper file access permissions
5. **Audit Trail**: Log all file operations for security auditing

## Updates and Maintenance

- Regularly review and update supported file types
- Monitor for new attack vectors
- Update security headers as needed
- Test security measures after any upload-related changes
- Keep dependencies updated for security patches