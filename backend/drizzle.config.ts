import { defineConfig } from 'drizzle-kit';
import fs from "fs";

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    user: process.env.DB_USER,
    password: fs.readFileSync(process.env.DB_PASSWORD_FILE!, 'utf-8').trim(),
    database: process.env.DB_NAME!
  }
})