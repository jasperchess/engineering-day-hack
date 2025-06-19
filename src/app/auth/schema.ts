import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("originalName").notNull(),
  fileSize: integer("fileSize").notNull(),
  fileType: text("fileType").notNull(),
  mimeType: text("mimeType").notNull(),
  uploadDate: integer("uploadDate", { mode: "timestamp" }).notNull(),
  uploadedBy: text("uploadedBy").references(() => user.id, {
    onDelete: "cascade",
  }),
  url: text("url"),
  thumbnailUrl: text("thumbnailUrl"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const sharedFiles = sqliteTable("sharedFiles", {
  id: text("id").primaryKey(),
  fileId: text("fileId")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  shareCode: text("shareCode").notNull().unique(),
  sharedBy: text("sharedBy")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  permissions: text("permissions", { enum: ["view", "download", "both"] })
    .notNull()
    .default("both"),
  maxDownloads: integer("maxDownloads"),
  downloadCount: integer("downloadCount").notNull().default(0),
  viewCount: integer("viewCount").notNull().default(0),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const shareAccessLog = sqliteTable("shareAccessLog", {
  id: text("id").primaryKey(),
  sharedFileId: text("sharedFileId")
    .notNull()
    .references(() => sharedFiles.id, { onDelete: "cascade" }),
  accessType: text("accessType", { enum: ["view", "download"] }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  accessedAt: integer("accessedAt", { mode: "timestamp" }).notNull(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type SharedFile = typeof sharedFiles.$inferSelect;
export type NewSharedFile = typeof sharedFiles.$inferInsert;
export type ShareAccessLog = typeof shareAccessLog.$inferSelect;
export type NewShareAccessLog = typeof shareAccessLog.$inferInsert;
