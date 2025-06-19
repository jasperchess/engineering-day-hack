const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

console.log("🔧 Initializing database for Better Auth...");

try {
  // Create SQLite database
  const db = new Database("sqlite.db");

  // Enable WAL mode for better performance
  db.pragma("journal_mode = WAL");

  // Create tables for Better Auth
  const createTables = `
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      fileType TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      uploadDate INTEGER NOT NULL,
      uploadedBy TEXT,
      url TEXT,
      thumbnailUrl TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (uploadedBy) REFERENCES user (id) ON DELETE CASCADE
    );
  `;

  // Execute the SQL commands
  db.exec(createTables);

  console.log("✅ Database tables created successfully!");

  // Check if .env.local exists, if not create from example
  const envPath = path.join(__dirname, ".env.local");
  const envExamplePath = path.join(__dirname, ".env.example");

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, "utf8");
    fs.writeFileSync(envPath, envExample);
    console.log("📝 Created .env.local from .env.example");
    console.log("⚠️  Please update your environment variables in .env.local");
  }

  console.log("\n🎉 Database initialization complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Update your .env.local file with proper values");
  console.log("2. Run 'npm run dev' to start the application");
  console.log("3. Visit http://localhost:3000 to see your app");

  db.close();
} catch (error) {
  console.error("❌ Database initialization failed:", error);
  process.exit(1);
}
