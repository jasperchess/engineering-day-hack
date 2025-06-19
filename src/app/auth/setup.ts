import { sql } from "drizzle-orm";
import { db, sqlite } from "./db";
import * as schema from "./schema";

export async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // Create tables using raw SQL on the sqlite instance
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    sqlite.exec(`
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
      )
    `);

    sqlite.exec(`
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
      )
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER,
        updatedAt INTEGER
      )
    `);

    sqlite.exec(`
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
      )
    `);

    console.log("Database setup completed successfully!");
    return true;
  } catch (error) {
    console.error("Database setup failed:", error);
    return false;
  }
}

// Auto-setup on import in development
if (process.env.NODE_ENV === "development") {
  setupDatabase().catch(console.error);
}
