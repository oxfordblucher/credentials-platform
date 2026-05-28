import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcrypt';

const { encryptPW, verifyPW } = await import('../../utils/encrypt.js');

// Pre-computed at cost=1 for speed; used in verifyPW tests.
const TEST_PASSWORD = 'correct-horse-battery-staple';
const testHash = await bcrypt.hash(TEST_PASSWORD, 1);

describe('password utilities', () => {
  it('hashPassword returns a string that does not equal the input', async () => {
    const hash = await encryptPW('my-secret');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('my-secret');
  });

  it('hashPassword produces a bcrypt hash (starts with "$2b$")', async () => {
    const hash = await encryptPW('my-secret');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('verifyPassword returns true when password matches the hash', async () => {
    const result = await verifyPW(TEST_PASSWORD, testHash);
    expect(result).toBe(true);
  });

  it('verifyPassword returns false for a wrong password', async () => {
    const result = await verifyPW('wrong-password', testHash);
    expect(result).toBe(false);
  });

  it('verifyPassword returns false for an empty string against a valid hash', async () => {
    const result = await verifyPW('', testHash);
    expect(result).toBe(false);
  });
});
