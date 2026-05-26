import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve to the backend root (4 levels up from src/tests/integration/setup/).
const backendRoot = path.resolve(__dirname, '../../../..');

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

  console.log('[globalSetup] Running drizzle-kit migrate against test database…');
  execSync('npx drizzle-kit migrate', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
    cwd: backendRoot,
  });
  console.log('[globalSetup] Migrations complete.');
}
