import { execSync } from 'child_process';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// process.cwd() is the backend root when Jest is invoked from that directory.
const backendRoot = process.cwd();

// Load .env.test so DATABASE_URL_TEST is available for migrations.
dotenvConfig({ path: path.join(backendRoot, '.env.test') });

export default async function globalSetup(): Promise<void> {
  const url = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL_DIRECT;

  if (!url) {
    console.warn(
      '\n[globalSetup] DATABASE_URL_TEST is not set — skipping migrations.\n' +
      '              Integration tests will fail unless the test database is already migrated.\n' +
      '              Set DATABASE_URL_TEST in backend/.env.test to enable auto-migration.\n',
    );
    return;
  }

  const env = { ...process.env, DATABASE_URL: url };

  console.log('[globalSetup] Pushing schema to test database…');
  execSync('npx drizzle-kit push', { env, stdio: 'inherit', cwd: backendRoot });

  console.log('[globalSetup] Applying data migrations…');
  execSync('npx drizzle-kit migrate', { env, stdio: 'inherit', cwd: backendRoot });

  console.log('[globalSetup] Test database ready.');
}
