// Provide test-only JWT secrets so token.ts loads without error.
if (!process.env.JWT_ACCESS_SECRET) process.env.JWT_ACCESS_SECRET = 'test-access-secret-do-not-use-in-production';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-production';

// Provide a placeholder DATABASE_URL so db/index.ts doesn't throw at import time;
// unit tests that don't touch the DB will never make a real query.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://localhost/credplat_test';
}
