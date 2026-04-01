import { defineConfig } from 'drizzle-kit';
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    user: process.env.DB_USER,
    password: fs.readFileSync(process.env.DB_PASSWORD_FILE!, 'utf-8').trim(),
    database: process.env.DB_NAME!,
    ssl: isProd ? { rejectUnauthorized: false } : false
  }
})