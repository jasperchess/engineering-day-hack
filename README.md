# File Vault AI

A secure, AI-powered file management system built with Next.js, featuring user authentication, file upload/download, and comprehensive security measures.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Setup & Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd engineering-day-hack
   npm install
   ```

2. **Initialize the database and environment:**
   ```bash
   npm run setup
   ```
   This will:
   - Create the SQLite database with required tables
   - Copy `.env.example` to `.env.local`
   - Set up authentication tables and file management schema

3. **Configure environment variables:**
   ```bash
   # Edit .env.local with your specific values
   cp .env.example .env.local
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Application

### Automated Testing
Run the comprehensive API test suite:
```bash
npm run test:files
```

This tests all file operations:
- File upload (multiple formats)
- File retrieval and listing
- File deletion
- Error handling
- Security validations

### Manual Testing Options

1. **Web Interface Testing:**
   - Visit [http://localhost:3000](http://localhost:3000)
   - Sign up/login to test authentication
   - Navigate to upload section
   - Test drag-and-drop file uploads
   - Test file viewing and deletion

2. **API Testing with cURL:**
   ```bash
   # Upload a file
   curl -X POST http://localhost:3000/api/files \
     -F "file=@path/to/your/file.jpg"

   # List all files
   curl http://localhost:3000/api/files

   # Delete a file
   curl -X DELETE http://localhost:3000/api/files/{file-id}
   ```

3. **Interactive Test Page:**
   If available, visit the test upload page for direct API interaction

### What to Test

**Core Functionality:**
- [ ] User registration and login
- [ ] File upload (images, documents, PDFs)
- [ ] File listing and pagination
- [ ] File download/viewing
- [ ] File deletion
- [ ] Large file handling (up to 10MB)

**Security Features:**
- [ ] File type validation (try uploading .exe files)
- [ ] File size limits (try files > 10MB)
- [ ] Authentication protection
- [ ] Error handling

**Edge Cases:**
- [ ] Network interruption during upload
- [ ] Duplicate file names
- [ ] Special characters in filenames
- [ ] Empty files
- [ ] Malformed requests

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Better Auth
- **Database:** SQLite with Drizzle ORM
- **File Storage:** Local file system (uploads directory)
- **Security:** Multi-layer validation, content-type checking

### Project Structure
```
engineering-day-hack/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API endpoints
│   │   │   ├── files/         # File management APIs
│   │   │   └── auth/          # Authentication APIs
│   │   ├── auth/              # Auth pages
│   │   ├── upload/            # File upload interface
│   │   └── files/             # File management interface
│   ├── components/            # Reusable UI components
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # Utility functions
├── uploads/                   # File storage directory
├── sqlite.db                  # SQLite database
└── middleware.ts              # Request middleware
```

### Key Components

**Authentication System:**
- Built with Better Auth
- Session-based authentication
- User registration and login
- Secure session management

**File Management:**
- Multi-format file support (images, documents, PDFs)
- UUID-based file naming for security
- Metadata storage in SQLite
- Stream-based upload processing

**Security Layers:**
1. Client-side validation (immediate feedback)
2. HTTP middleware validation (early request filtering)
3. Stream validation (real-time monitoring)
4. Save-time validation (final verification)

### Database Schema

**Core Tables:**
- `user` - User accounts and profiles
- `session` - Authentication sessions
- `files` - File metadata and relationships
- `account` - OAuth account linking
- `verification` - Email verification tokens

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server with turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio

# Setup & Testing
npm run setup        # Complete initial setup
npm run auth:setup   # Initialize database only
npm run test:files   # Run file API tests
```

## 📁 API Endpoints

### Authentication
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout

### File Management
- `POST /api/files` - Upload files
- `GET /api/files` - List files (with pagination)
- `GET /api/files/[id]` - Get file details
- `DELETE /api/files/[id]` - Delete file
- `GET /uploads/[filename]` - Access file content

## 🔒 Security Features

**File Upload Security:**
- Whitelist-based file type validation
- File size limits (10MB max)
- Content-type verification
- Filename sanitization
- Stream-based validation to prevent DoS attacks

**Authentication Security:**
- Session-based authentication
- CSRF protection
- Secure password hashing
- Email verification support

**General Security:**
- Security headers (HSTS, CSP, etc.)
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Error message sanitization

## 🚨 Common Issues & Troubleshooting

### Setup Issues
**Database initialization fails:**
```bash
# Delete existing database and retry
rm sqlite.db sqlite.db-shm sqlite.db-wal
npm run auth:setup
```

**Environment variables not found:**
```bash
# Ensure .env.local exists and is properly configured
cp .env.example .env.local
# Edit .env.local with your values
```

### Runtime Issues
**File uploads failing:**
- Check file size (must be < 10MB)
- Verify file type is supported
- Ensure uploads directory exists and is writable
- Check network connectivity

**Authentication not working:**
- Verify database is initialized
- Check session configuration in .env.local
- Clear browser cookies/sessions

**API endpoints returning 404:**
- Ensure development server is running on port 3000
- Check API route file structure
- Verify Next.js app router configuration

### Performance Issues
**Slow file uploads:**
- Check file sizes (large files take longer)
- Verify network connection
- Consider implementing upload progress indicators

**Database slow queries:**
- Run `npm run db:studio` to inspect data
- Check for proper indexing
- Consider pagination for large file lists

## 📚 Additional Documentation

- **[Files API Usage Guide](FILES_API_USAGE.md)** - Comprehensive API documentation
- **[Security Implementation](SECURITY.md)** - Detailed security measures
- **[Logging Implementation](LOGGING_IMPLEMENTATION.md)** - Logging and monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:files`
5. Run linting: `npm run lint`
6. Submit a pull request

### Adding New Features
- Update TypeScript types in `src/types/`
- Add appropriate tests
- Update API documentation
- Consider security implications

## 🎯 Key Features

✅ **Secure File Upload** - Multi-layer security validation  
✅ **User Authentication** - Complete auth system with Better Auth  
✅ **File Management** - Upload, view, download, delete files  
✅ **Responsive Design** - Modern UI with Tailwind CSS  
✅ **API-First Design** - RESTful APIs for all operations  
✅ **Type Safety** - Full TypeScript implementation  
✅ **Database Integration** - SQLite with Drizzle ORM  
✅ **Security Hardened** - Protection against common attacks  

## 📊 Supported File Types

- **Images:** JPEG, PNG, GIF, WebP
- **Documents:** PDF, DOC, DOCX, XLS, XLSX  
- **Text:** Plain text files
- **Size Limit:** 10MB per file

---

**Need Help?** Check the troubleshooting section above or review the detailed documentation files for specific topics.