import { describe, it, expect } from '@jest/globals';
import { validateTransition } from '../../utils/stateMachine.js';
import { AppError, ConflictError } from '../../errors/AppError.js';

type CredentialStatus = 'pending' | 'active' | 'rejected' | 'expired' | 'revoked';

function expectConflict409(from: CredentialStatus | null, to: CredentialStatus) {
  let error: AppError | undefined;
  try {
    validateTransition(from, to);
  } catch (e) {
    error = e as AppError;
  }
  expect(error).toBeInstanceOf(ConflictError);
  expect(error?.statusCode).toBe(409);
}

describe('credential state machine', () => {
  describe('valid transitions — must not throw', () => {
    it('none → pending (initial submit)', () => {
      expect(() => validateTransition(null, 'pending')).not.toThrow();
    });

    it('pending → active (verify)', () => {
      expect(() => validateTransition('pending', 'active')).not.toThrow();
    });

    it('pending → rejected (reject)', () => {
      expect(() => validateTransition('pending', 'rejected')).not.toThrow();
    });

    it('rejected → pending (resubmit)', () => {
      expect(() => validateTransition('rejected', 'pending')).not.toThrow();
    });

    it('active → revoked (revoke)', () => {
      expect(() => validateTransition('active', 'revoked')).not.toThrow();
    });

    it('active → expired (cron)', () => {
      expect(() => validateTransition('active', 'expired')).not.toThrow();
    });

    it('expired → pending (resubmit after expiry)', () => {
      expect(() => validateTransition('expired', 'pending')).not.toThrow();
    });
  });

  describe('invalid transitions — must throw AppError(409)', () => {
    it('active → pending', () => {
      expectConflict409('active', 'pending');
    });

    it('active → rejected', () => {
      expectConflict409('active', 'rejected');
    });

    it('rejected → active', () => {
      expectConflict409('rejected', 'active');
    });

    it('rejected → expired', () => {
      expectConflict409('rejected', 'expired');
    });

    it('revoked → active', () => {
      expectConflict409('revoked', 'active');
    });

    it('revoked → pending', () => {
      expectConflict409('revoked', 'pending');
    });

    it('expired → active', () => {
      expectConflict409('expired', 'active');
    });

    it('expired → revoked', () => {
      expectConflict409('expired', 'revoked');
    });
  });
});
