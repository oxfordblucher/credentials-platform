import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.test so DATABASE_URL_TEST is available for this test process.
dotenvConfig({ path: path.join(process.cwd(), '.env.test') });

// Point token utilities at the test JWT secrets file.
process.env.JWT_SECRET_FILE = path.join(__dirname, 'secrets.test.json');

// Route all DB operations to the test database so tests never touch production data.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
} else if (!process.env.DATABASE_URL) {
  // Provide a placeholder so db/index.ts doesn't throw at import time;
  // tests that actually need a DB will fail on first query instead of at startup.
  process.env.DATABASE_URL = 'postgres://localhost/credplat_test';
}

// Resend throws at construction time when no API key is present. Provide a
// placeholder so the module loads cleanly; sendEmail already silences errors.
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = 're_test_placeholder';
}
