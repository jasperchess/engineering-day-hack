import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { schema });

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

// Export the sqlite instance for Better Auth
export { sqlite };
