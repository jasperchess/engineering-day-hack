const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

console.log('Initializing database...');

// Create files table
const createFilesTable = `
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  originalName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  fileType TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  uploadDate INTEGER NOT NULL,
  uploadedBy TEXT REFERENCES user(id) ON DELETE CASCADE,
  url TEXT,
  thumbnailUrl TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
`;

try {
  db.exec(createFilesTable);
  console.log('✅ Files table created successfully');

  // Check if user table exists (it should from auth setup)
  const userTableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='user'
  `).get();

  if (userTableExists) {
    console.log('✅ User table already exists');
  } else {
    console.log('⚠️  User table not found - you may need to run auth migrations first');
  }

  // Create uploads directory
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '..', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
  } else {
    console.log('✅ Uploads directory already exists');
  }

  console.log('🎉 Database initialization completed successfully!');

} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
} finally {
  db.close();
}
