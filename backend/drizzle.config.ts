import { defineConfig } from 'drizzle-kit';
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

const password = process.env.DB_PASSWORD_FILE
  ? fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf-8').trim()
  : process.env.DB_PASSWORD ?? '';

const dbCredentials = process.env.DATABASE_URL_DIRECT
  ? ({ url: process.env.DATABASE_URL_DIRECT } as const)
  : ({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      user: process.env.DB_USER,
      password,
      database: process.env.DB_NAME ?? 'postgres',
      ssl: isProd ? { rejectUnauthorized: false } : false,
    } as const);

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials,
})