import { jest, describe, it, expect, afterEach } from '@jest/globals';

const { signAccessToken, verifyAccess, signRefreshToken, verifyRefresh } =
  await import('../../utils/token.js');

const MS = {
  MINUTE: 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

const basePayload = {
  id: 'user-abc123',
  orgId: 'org-def456',
  sessionId: 'session-ghi789',
  orgRole: null as null,
};

describe('JWT utilities', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('signAccessToken / verifyAccess', () => {
    it('verifyAccess returns the original payload for a valid token', () => {
      const token = signAccessToken(basePayload);
      const decoded = verifyAccess(token);
      expect(decoded.id).toBe(basePayload.id);
      expect(decoded.orgId).toBe(basePayload.orgId);
      expect(decoded.sessionId).toBe(basePayload.sessionId);
      expect(decoded.orgRole).toBe(basePayload.orgRole);
    });

    it('verifyAccess throws for a token signed with a different secret', () => {
      const token = signAccessToken(basePayload);
      // Replace the signature with garbage to simulate a different-secret signature.
      const [header, payload] = token.split('.');
      const tamperedToken = `${header}.${payload}.invalid-signature`;
      expect(() => verifyAccess(tamperedToken)).toThrow();
    });

    it('verifyAccess throws for an expired token', () => {
      jest.useFakeTimers();
      const token = signAccessToken(basePayload); // expiresIn: '15m'
      jest.advanceTimersByTime(16 * MS.MINUTE);
      expect(() => verifyAccess(token)).toThrow();
    });

    it('verifyAccess throws for a tampered payload (modified base64 middle segment)', () => {
      const token = signAccessToken(basePayload);
      const [header, , signature] = token.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({ id: 'hacker', orgId: 'evil-org', sessionId: 'x', orgRole: 'owner' }),
      ).toString('base64url');
      const tamperedToken = `${header}.${tamperedPayload}.${signature}`;
      expect(() => verifyAccess(tamperedToken)).toThrow();
    });
  });

  describe('refresh token', () => {
    it('verifyRefresh returns payload for valid refresh token', () => {
      const token = signRefreshToken('user-abc123', 'session-ghi789');
      const decoded = verifyRefresh(token);
      expect(decoded.user).toBe('user-abc123');
    });

    it('verifyRefresh throws for expired refresh token', () => {
      jest.useFakeTimers();
      const token = signRefreshToken('user-abc123', 'session-ghi789'); // expiresIn: '7d'
      jest.advanceTimersByTime(8 * MS.DAY);
      expect(() => verifyRefresh(token)).toThrow();
    });
  });
});
