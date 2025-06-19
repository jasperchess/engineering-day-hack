import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/app/auth/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./sqlite.db",
  },
});
