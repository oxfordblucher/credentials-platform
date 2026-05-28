import { daysUntil, formatExpiry, isExpiringSoon, expiryColourClass } from '~/lib/utils/dates';

const FROZEN = new Date('2026-01-15T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('daysUntil', () => {
  it('returns positive integer for a future date', () => {
    expect(daysUntil('2026-02-15')).toBe(31);
  });

  it('returns 0 for today', () => {
    expect(daysUntil('2026-01-15')).toBe(0);
  });

  it('returns negative integer for a past date', () => {
    expect(daysUntil('2026-01-10')).toBe(-5);
  });

  it('result is not affected by time-of-day (midnight normalization)', () => {
    expect(daysUntil('2026-01-16T23:59:59.999Z')).toBe(daysUntil('2026-01-16'));
  });
});

describe('formatExpiry', () => {
  it('returns "Expires ..." for a future date', () => {
    expect(formatExpiry('2026-06-01')).toBe('Expires Jun 1, 2026');
  });

  it('returns "Expired ..." for a past date', () => {
    expect(formatExpiry('2025-06-01')).toBe('Expired Jun 1, 2025');
  });
});

describe('isExpiringSoon', () => {
  it('true — date is within 30 days (default) and in future', () => {
    expect(isExpiringSoon('2026-01-20')).toBe(true);
  });

  it('false — date is more than 30 days away', () => {
    expect(isExpiringSoon('2026-03-01')).toBe(false);
  });

  it('false — date is in the past', () => {
    expect(isExpiringSoon('2025-12-01')).toBe(false);
  });

  it('respects custom thresholdDays argument', () => {
    expect(isExpiringSoon('2026-02-20', 40)).toBe(true);
  });
});

describe('expiryColourClass', () => {
  it('text-red-600 for 0 days remaining', () => {
    expect(expiryColourClass(0)).toBe('text-red-600');
  });

  it('text-red-600 for 7 days remaining', () => {
    expect(expiryColourClass(7)).toBe('text-red-600');
  });

  it('text-amber-600 for 8 days remaining', () => {
    expect(expiryColourClass(8)).toBe('text-amber-600');
  });

  it('text-amber-600 for 30 days remaining', () => {
    expect(expiryColourClass(30)).toBe('text-amber-600');
  });

  it('text-slate-500 for 31 days remaining', () => {
    expect(expiryColourClass(31)).toBe('text-slate-500');
  });
});
