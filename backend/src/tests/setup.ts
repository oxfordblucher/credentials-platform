import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Point JWT utilities at the test secrets file so token.ts loads without error.
process.env.JWT_SECRET_FILE = path.join(__dirname, 'integration/setup/secrets.test.json');

// Provide a placeholder DATABASE_URL so db/index.ts doesn't throw at import time;
// unit tests that don't touch the DB will never make a real query.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://localhost/credplat_test';
}
