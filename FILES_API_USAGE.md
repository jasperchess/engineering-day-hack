# Files API Usage Guide

This guide explains how to use the file upload, retrieval, and management API endpoints in this Next.js application.

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the API with the included test page:**
   - Open http://localhost:3000/test-upload.html in your browser
   - Or run the automated test: `npm run test:files`

## 📁 API Endpoints

### 1. Upload Files
**POST** `/api/files`

Upload one or more files to the server.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/files', {
  method: 'POST',
  body: formData
});

const result = await response.json();
if (result.success) {
  console.log('File uploaded:', result.file);
}
```

**Response:**
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
    "url": "/uploads/generated-filename.ext"
  }
}
```

### 2. Get All Files
**GET** `/api/files`

Retrieve a list of all uploaded files with pagination.

**Query Parameters:**
- `limit` (optional): Number of files to return (default: 50)
- `offset` (optional): Number of files to skip (default: 0)

**Example:**
```javascript
const response = await fetch('/api/files?limit=10&offset=0');
const result = await response.json();
console.log('Files:', result.files);
```

### 3. Get Single File
**GET** `/api/files/{id}`

Get information about a specific file by ID.

**Example:**
```javascript
const response = await fetch('/api/files/123e4567-e89b-12d3-a456-426614174000');
const result = await response.json();
console.log('File:', result.file);
```

### 4. Delete File
**DELETE** `/api/files/{id}`

Delete a file by ID.

**Example:**
```javascript
const response = await fetch('/api/files/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE'
});
const result = await response.json();
console.log('Deleted:', result.success);
```

### 5. Access Files
**GET** `/uploads/{filename}`

Direct access to uploaded files for viewing/downloading.

**Example:**
```html
<img src="/uploads/uuid-generated-filename.jpg" alt="Uploaded image">
```

## 📋 File Validation

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX
- **Text**: Plain text files

### File Size Limits
- Maximum file size: **10MB** per file

### File Categories
Files are automatically categorized:
- `image` - Image files
- `document` - Word documents
- `spreadsheet` - Excel files
- `pdf` - PDF files
- `text` - Plain text files
- `other` - Other supported types

## 🧪 Testing

### Automated Testing
Run the included test script:
```bash
npm run test:files
```

This will test all API endpoints automatically.

### Manual Testing
1. Open http://localhost:3000/test-upload.html
2. Upload files using drag & drop or file picker
3. View, download, and delete files
4. Test different file types and sizes

### Test with cURL
```bash
# Upload a file
curl -X POST http://localhost:3000/api/files \
  -F "file=@/path/to/your/file.jpg"

# Get all files
curl http://localhost:3000/api/files

# Get single file
curl http://localhost:3000/api/files/{file-id}

# Delete file
curl -X DELETE http://localhost:3000/api/files/{file-id}
```

## 🔧 Technical Details

### Database Schema
Files are stored in a SQLite database with this schema:
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

### File Storage
- Files are stored in the `uploads/` directory
- Filenames are generated using UUIDs to prevent conflicts
- Original filenames are preserved in the database

### Security Features
- File type validation against whitelist
- File size limits enforced
- Filename sanitization to prevent directory traversal
- Unique generated filenames prevent conflicts

## 🚨 Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Description of the error"
}
```

Common errors:
- **400 Bad Request**: Invalid file type, file too large, missing file
- **404 Not Found**: File not found
- **500 Internal Server Error**: Server error during processing

## 🔗 Integration Examples

### React Hook
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
      if (!result.success) throw new Error(result.error);
      
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

### Vue.js Component
```vue
<template>
  <div>
    <input type="file" @change="handleFileUpload" multiple>
    <div v-if="uploading">Uploading...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      uploading: false,
      error: null
    }
  },
  methods: {
    async handleFileUpload(event) {
      const files = event.target.files;
      
      for (const file of files) {
        await this.uploadFile(file);
      }
    },
    
    async uploadFile(file) {
      this.uploading = true;
      this.error = null;
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        
        console.log('File uploaded:', result.file);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.uploading = false;
      }
    }
  }
}
</script>
```

## 📚 Additional Resources

- **API Documentation**: See `src/app/api/files/README.md` for detailed API docs
- **TypeScript Types**: Check `src/types/file.ts` for type definitions
- **Test Examples**: Review `test-files-api.js` for usage examples
- **Database Schema**: See `src/app/auth/schema.ts` for the complete schema

## 🤝 Contributing

When adding new features:
1. Update the API documentation
2. Add appropriate tests
3. Update TypeScript types if needed
4. Test with the included test suite

## 🐛 Troubleshooting

### Common Issues

1. **"File too large" error**
   - Check that file is under 10MB limit
   - Modify `MAX_FILE_SIZE` in `src/types/file.ts` if needed

2. **"Unsupported file type" error**
   - Check `SUPPORTED_FILE_TYPES` in `src/types/file.ts`
   - Add new MIME types to the array if needed

3. **Database errors**
   - Ensure the database is initialized: check if `sqlite.db` exists
   - Run the setup script if needed

4. **Files not accessible**
   - Check that the `uploads/` directory exists and is writable
   - Verify file permissions

5. **API not responding**
   - Ensure the Next.js server is running: `npm run dev`
   - Check that you're using the correct port (default: 3000)