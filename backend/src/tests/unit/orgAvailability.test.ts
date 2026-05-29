import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../db/index.js', () => ({
  db: { select: jest.fn() },
}));

const { db } = await import('../../db/index.js');
const { checkOrgAvailability } = await import('../../services/org.serv.js');

function mockSelect(rows: Record<string, unknown>[]) {
  const limit = jest.fn(() => Promise.resolve(rows));
  const where = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where }));
  jest.mocked(db.select).mockReturnValue({ from } as any);
}

describe('checkOrgAvailability', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns true when no org with that name exists', async () => {
    mockSelect([]);
    expect(await checkOrgAvailability('Brand New Corp')).toBe(true);
  });

  it('returns false when an org with that name already exists', async () => {
    mockSelect([{ id: 'org-abc' }]);
    expect(await checkOrgAvailability('Acme Inc')).toBe(false);
  });
});
