# Files API Documentation

This API provides endpoints for managing file uploads, retrieval, and deletion.

## Base URL

All endpoints are relative to `/api/files`

## Endpoints

### 1. Upload File

**POST** `/api/files`

Upload a new file to the server.

#### Request

- **Content-Type**: `multipart/form-data`
- **Body**: Form data with a `file` field

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/files', {
  method: 'POST',
  body: formData
})
```

#### Response

```json
{
  "success": true,
  "file": {
    "id": "uuid-string",
    "filename": "generated-filename.ext",
    "originalName": "original-filename.ext",
    "fileSize": 1024,
    "fileType": "image",
    "mimeType": "image/jpeg",
    "uploadDate": "2024-01-01T00:00:00.000Z",
    "uploadedBy": "user-id",
    "url": "/uploads/generated-filename.ext",
    "thumbnailUrl": null
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

#### Status Codes

- `200`: File uploaded successfully
- `400`: Bad request (no file, invalid file type, file too large)
- `500`: Internal server error

### 2. Get All Files

**GET** `/api/files`

Retrieve a list of all uploaded files with pagination support.

#### Query Parameters

- `limit` (optional): Number of files to return (default: 50)
- `offset` (optional): Number of files to skip (default: 0)

#### Example

```
GET /api/files?limit=10&offset=0
```

#### Response

```json
{
  "success": true,
  "files": [
    {
      "id": "uuid-string",
      "filename": "generated-filename.ext",
      "originalName": "original-filename.ext",
      "fileSize": 1024,
      "fileType": "image",
      "mimeType": "image/jpeg",
      "uploadDate": "2024-01-01T00:00:00.000Z",
      "uploadedBy": "user-id",
      "url": "/uploads/generated-filename.ext",
      "thumbnailUrl": null
    }
  ],
  "total": 1
}
```

#### Status Codes

- `200`: Files retrieved successfully
- `500`: Internal server error

### 3. Get Single File

**GET** `/api/files/{id}`

Retrieve information about a specific file by its ID.

#### Parameters

- `id`: The unique identifier of the file

#### Example

```
GET /api/files/123e4567-e89b-12d3-a456-426614174000
```

#### Response

```json
{
  "success": true,
  "file": {
    "id": "uuid-string",
    "filename": "generated-filename.ext",
    "originalName": "original-filename.ext",
    "fileSize": 1024,
    "fileType": "image",
    "mimeType": "image/jpeg",
    "uploadDate": "2024-01-01T00:00:00.000Z",
    "uploadedBy": "user-id",
    "url": "/uploads/generated-filename.ext",
    "thumbnailUrl": null
  }
}
```

#### Status Codes

- `200`: File found and returned
- `400`: Invalid file ID
- `404`: File not found
- `500`: Internal server error

### 4. Delete File

**DELETE** `/api/files/{id}`

Delete a specific file by its ID.

#### Parameters

- `id`: The unique identifier of the file

#### Example

```
DELETE /api/files/123e4567-e89b-12d3-a456-426614174000
```

#### Response

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### Status Codes

- `200`: File deleted successfully
- `400`: Invalid file ID
- `404`: File not found
- `500`: Internal server error

### 5. Serve File

**GET** `/uploads/{filename}`

Serve the actual file content for download or display.

#### Parameters

- `filename`: The generated filename of the uploaded file

#### Example

```
GET /uploads/uuid-generated-filename.jpg
```

#### Response

Returns the raw file content with appropriate headers:
- `Content-Type`: Based on file extension
- `Content-Length`: File size in bytes
- `Cache-Control`: Set for optimal caching
- `Content-Disposition`: Inline display

#### Status Codes

- `200`: File served successfully
- `400`: Invalid filename
- `404`: File not found
- `500`: Internal server error

## File Validation

### Supported File Types

- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX
- **Text**: Plain text files

### File Size Limits

- Maximum file size: 10MB

### File Type Categories

Files are automatically categorized based on their MIME type:
- `image`: Image files
- `document`: Word documents
- `spreadsheet`: Excel files
- `pdf`: PDF files
- `text`: Plain text files
- `other`: Other supported types

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Description of the error"
}
```

Common error scenarios:
- File too large
- Unsupported file type
- File not found
- Invalid request parameters
- Server errors

## Security Considerations

- File names are sanitized to prevent directory traversal attacks
- File types are validated against a whitelist
- File size limits are enforced
- Unique filenames are generated to prevent conflicts
- Files are stored outside the web root directory

## Database Schema

Files are stored with the following structure:

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  originalName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  fileType TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  uploadDate INTEGER NOT NULL,
  uploadedBy TEXT REFERENCES user(id),
  url TEXT,
  thumbnailUrl TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

## Usage Examples

### JavaScript/TypeScript

```javascript
// Upload a file
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/files', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// Get all files
async function getFiles(limit = 50, offset = 0) {
  const response = await fetch(`/api/files?limit=${limit}&offset=${offset}`);
  return await response.json();
}

// Get single file
async function getFile(id) {
  const response = await fetch(`/api/files/${id}`);
  return await response.json();
}

// Delete file
async function deleteFile(id) {
  const response = await fetch(`/api/files/${id}`, {
    method: 'DELETE'
  });
  return await response.json();
}
```

### React Hook Example

```javascript
import { useState } from 'react';

function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.file;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error };
}
```
