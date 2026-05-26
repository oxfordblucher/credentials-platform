import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Pure function — no module mocks needed.
const { computeNextAlertAt } = await import('../../utils/expirationAlerts.js');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Freeze time at a clean UTC midnight so day arithmetic is exact.
const NOW = new Date('2026-01-01T00:00:00.000Z');

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * MS_PER_DAY);
}

describe('computeNextAlertAt', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('91 days out → next alert at expiration minus 30 days (61 days from now)', () => {
    const expiration = daysFromNow(91);
    const result = computeNextAlertAt(expiration);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBe(daysFromNow(61).getTime());
  });

  it('31 days out → next alert at expiration minus 30 days (1 day from now)', () => {
    const expiration = daysFromNow(31);
    const result = computeNextAlertAt(expiration);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBe(daysFromNow(1).getTime());
  });

  it('8 days out → next alert at expiration minus 7 days (1 day from now)', () => {
    const expiration = daysFromNow(8);
    const result = computeNextAlertAt(expiration);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBe(daysFromNow(1).getTime());
  });

  it('7 days out → null (no more alerts to schedule)', () => {
    expect(computeNextAlertAt(daysFromNow(7))).toBeNull();
  });

  it('0 days out → null (expiring today)', () => {
    expect(computeNextAlertAt(daysFromNow(0))).toBeNull();
  });

  it('past expiry → null', () => {
    expect(computeNextAlertAt(daysFromNow(-5))).toBeNull();
  });
});
