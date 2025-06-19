const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_FILE_PATH = path.join(__dirname, 'test-image.png');

// Create a simple test image file (1x1 PNG)
const createTestImage = () => {
  // This is a minimal 1x1 transparent PNG
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0B, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, // compressed data
    0x0A, 0x2D, 0xB4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  fs.writeFileSync(TEST_FILE_PATH, pngBuffer);
  console.log('✅ Test image created');
};

// Test file upload
const testFileUpload = async () => {
  console.log('🧪 Testing file upload...');

  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_FILE_PATH), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const response = await fetch(`${API_BASE_URL}/api/files`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ File upload successful');
      console.log('📄 Uploaded file info:', {
        id: result.file.id,
        filename: result.file.filename,
        originalName: result.file.originalName,
        fileSize: result.file.fileSize,
        fileType: result.file.fileType,
        url: result.file.url
      });
      return result.file.id;
    } else {
      console.error('❌ File upload failed:', result.error || 'Unknown error');
      console.error('Response status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ File upload error:', error.message);
    return null;
  }
};

// Test get all files
const testGetAllFiles = async () => {
  console.log('🧪 Testing get all files...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/files`);
    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Get all files successful');
      console.log(`📄 Found ${result.files.length} files (total: ${result.total})`);
      result.files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.originalName} (${file.fileType}, ${file.fileSize} bytes)`);
      });
    } else {
      console.error('❌ Get all files failed:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Get all files error:', error.message);
  }
};

// Test get single file
const testGetSingleFile = async (fileId) => {
  if (!fileId) {
    console.log('⏭️  Skipping single file test (no file ID)');
    return;
  }

  console.log('🧪 Testing get single file...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`);
    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Get single file successful');
      console.log('📄 File details:', {
        id: result.file.id,
        originalName: result.file.originalName,
        fileType: result.file.fileType,
        fileSize: result.file.fileSize,
        uploadDate: new Date(result.file.uploadDate).toISOString()
      });
    } else {
      console.error('❌ Get single file failed:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Get single file error:', error.message);
  }
};

// Test file serving
const testFileServing = async (fileUrl) => {
  if (!fileUrl) {
    console.log('⏭️  Skipping file serving test (no file URL)');
    return;
  }

  console.log('🧪 Testing file serving...');

  try {
    const response = await fetch(`${API_BASE_URL}${fileUrl}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log('✅ File serving successful');
      console.log(`📄 Content-Type: ${contentType}, Content-Length: ${contentLength}`);
    } else {
      console.error('❌ File serving failed, status:', response.status);
    }
  } catch (error) {
    console.error('❌ File serving error:', error.message);
  }
};

// Test file deletion
const testFileDelete = async (fileId) => {
  if (!fileId) {
    console.log('⏭️  Skipping file deletion test (no file ID)');
    return;
  }

  console.log('🧪 Testing file deletion...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
      method: 'DELETE'
    });
    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ File deletion successful');
      console.log('📄 Message:', result.message);
    } else {
      console.error('❌ File deletion failed:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ File deletion error:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Files API Tests');
  console.log('=====================================');

  // Check if server is running
  try {
    const response = await fetch(`${API_BASE_URL}/api/files`);
    if (!response.ok && response.status !== 500) {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Server not accessible. Make sure the Next.js server is running on port 3000');
    console.error('   Run: npm run dev');
    process.exit(1);
  }

  // Create test file
  createTestImage();

  // Run tests
  const uploadedFileId = await testFileUpload();
  const uploadedFile = uploadedFileId ? { id: uploadedFileId, url: `/uploads/test-${uploadedFileId}.png` } : null;

  console.log('');
  await testGetAllFiles();

  console.log('');
  await testGetSingleFile(uploadedFileId);

  console.log('');
  await testFileServing(uploadedFile?.url);

  console.log('');
  await testFileDelete(uploadedFileId);

  // Cleanup
  if (fs.existsSync(TEST_FILE_PATH)) {
    fs.unlinkSync(TEST_FILE_PATH);
    console.log('🧹 Test file cleaned up');
  }

  console.log('');
  console.log('✨ All tests completed!');
  console.log('=====================================');
};

// Handle async errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Install required dependencies if they don't exist
const checkDependencies = () => {
  try {
    require('form-data');
  } catch (error) {
    console.log('📦 Installing required dependencies...');
    require('child_process').execSync('npm install form-data', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  }
};

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This test requires Node.js 18+ with native fetch support');
  console.error('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the tests
checkDependencies();
runTests().catch(console.error);
