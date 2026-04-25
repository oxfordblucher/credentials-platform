import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

// ── Mock primitives ──────────────────────────────────────────────────
const mockSelectLimit    = jest.fn() as AnyMock;
const mockSelectWhere    = jest.fn() as AnyMock;
const mockSelectFrom     = jest.fn() as AnyMock;
const mockUpdateReturning = jest.fn() as AnyMock;
const mockUpdateWhere    = jest.fn() as AnyMock;
const mockUpdateSet      = jest.fn() as AnyMock;
const mockInsertValues   = jest.fn() as AnyMock;
const mockTxSelect       = jest.fn() as AnyMock;
const mockTxUpdate       = jest.fn() as AnyMock;
const mockTxInsert       = jest.fn() as AnyMock;
const mockTransaction    = jest.fn() as AnyMock;

const mockTx = {
  select: (...a: unknown[]) => mockTxSelect(...a),
  update: (...a: unknown[]) => mockTxUpdate(...a),
  insert: (...a: unknown[]) => mockTxInsert(...a),
};

jest.unstable_mockModule('../../db/index', () => ({
  db: { transaction: (...a: unknown[]) => mockTransaction(...a) },
}));

jest.unstable_mockModule('../../db/schema/index', () => ({
  userCredentials:    { user_id: 'user_id', credential_id: 'credential_id', status: 'status' },
  credentialAuditLog: {},
}));

jest.unstable_mockModule('drizzle-orm', () => ({
  and: (...args: unknown[]) => args,
  eq:  (_c: unknown, v: unknown) => v,
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ sql: strings.join(''), values }),
    { raw: (s: string) => ({ sql: s }) }
  ),
}));

const { verifyCredential, rejectCredential, revokeCredential } = await import('../../services/reviewCredential.serv.js');

// ── Helpers ──────────────────────────────────────────────────────────
const BASE = { actorId: 'mgr-1', userId: 'user-1', credentialTypeId: 'cred-1' };

const EXISTING = { status: 'pending' };

function resetMocks(existing: { status: string } | null = EXISTING, updated = { user_id: 'user-1', credential_id: 'cred-1', status: 'active' }) {
  jest.clearAllMocks();

  mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx));

  mockSelectLimit.mockResolvedValue(existing ? [existing] : []);
  mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockTxSelect.mockReturnValue({ from: mockSelectFrom });

  mockUpdateReturning.mockResolvedValue([updated]);
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockTxUpdate.mockReturnValue({ set: mockUpdateSet });

  mockInsertValues.mockResolvedValue([]);
  mockTxInsert.mockReturnValue({ values: mockInsertValues });
}

// ── Tests ─────────────────────────────────────────────────────────────
describe('verifyCredential', () => {
  beforeEach(() => resetMocks());

  it('throws NotFoundError if credential not found', async () => {
    resetMocks(null);
    const { NotFoundError } = await import('../../errors/AppError.js');
    await expect(verifyCredential({ ...BASE, expiration_date: new Date('2027-01-01') })).rejects.toThrow(NotFoundError);
  });

  it('runs inside a transaction', async () => {
    await verifyCredential({ ...BASE, expiration_date: new Date('2027-01-01') });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('writes audit log with to_status=active', async () => {
    await verifyCredential({ ...BASE, expiration_date: new Date('2027-01-01') });
    const auditValues = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(auditValues?.to_status).toBe('active');
    expect(auditValues?.from_status).toBe('pending');
    expect(auditValues?.actor_id).toBe('mgr-1');
  });

  it('returns the updated credential', async () => {
    const result = await verifyCredential({ ...BASE, expiration_date: new Date('2027-01-01') });
    expect(result).toMatchObject({ user_id: 'user-1', credential_id: 'cred-1' });
  });

  it('sets expiration_date in the update', async () => {
    const expDate = new Date('2027-01-01');
    await verifyCredential({ ...BASE, expiration_date: expDate });
    const setArg = (mockTxUpdate.mock.results[0]?.value as { set: AnyMock }).set?.mock?.calls[0]?.[0];
    expect(setArg?.expiration_date).toEqual(expDate);
  });

  it('sets verified_metadata=null when not provided', async () => {
    await verifyCredential({ ...BASE, expiration_date: new Date('2027-01-01') });
    const setArg = (mockTxUpdate.mock.results[0]?.value as { set: AnyMock }).set?.mock?.calls[0]?.[0];
    expect(setArg?.verified_metadata).toBeNull();
  });

  it('sets verified_metadata when provided', async () => {
    await verifyCredential({ ...BASE, expiration_date: new Date('2027-01-01'), verified_metadata: { cert: 'ok' } });
    const setArg = (mockTxUpdate.mock.results[0]?.value as { set: AnyMock }).set?.mock?.calls[0]?.[0];
    expect(setArg?.verified_metadata).toEqual({ cert: 'ok' });
  });
});

describe('rejectCredential', () => {
  beforeEach(() => resetMocks(EXISTING, { user_id: 'user-1', credential_id: 'cred-1', status: 'rejected' }));

  it('throws NotFoundError if credential not found', async () => {
    resetMocks(null);
    const { NotFoundError } = await import('../../errors/AppError.js');
    await expect(rejectCredential({ ...BASE, rejection_reason_id: 'reason-1' })).rejects.toThrow(NotFoundError);
  });

  it('writes audit log with to_status=rejected', async () => {
    await rejectCredential({ ...BASE, rejection_reason_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', review_notes: 'bad doc' });
    const auditValues = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(auditValues?.to_status).toBe('rejected');
    expect(auditValues?.notes).toBe('bad doc');
  });

  it('runs inside a transaction', async () => {
    await rejectCredential({ ...BASE, rejection_reason_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('writes audit log with from_status', async () => {
    await rejectCredential({ ...BASE, rejection_reason_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });
    const auditValues = (mockTxInsert.mock.results[0]?.value as { values: AnyMock }).values?.mock?.calls[0]?.[0];
    expect(auditValues?.from_status).toBe('pending');
    expect(auditValues?.actor_id).toBe('mgr-1');
  });

  it('returns the updated credential', async () => {
    const result = await rejectCredential({ ...BASE, rejection_reason_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });
    expect(result).toMatchObject({ user_id: 'user-1', credential_id: 'cred-1' });
  });
});

describe('revokeCredential', () => {
  beforeEach(() => resetMocks(EXISTING, { user_id: 'user-1', credential_id: 'cred-1', status: 'revoked' }));

  it('throws NotFoundError if credential not found', async () => {
    resetMocks(null);
    const { NotFoundError } = await import('../../errors/AppError.js');
    await expect(revokeCredential({ ...BASE, reason: 'document expired' })).rejects.toThrow(NotFoundError);
  });

  it('writes audit log with to_status=revoked and reason as notes', async () => {
    await revokeCredential({ ...BASE, reason: 'document expired' });
    const auditValues = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(auditValues?.to_status).toBe('revoked');
    expect(auditValues?.notes).toBe('document expired');
  });

  it('runs inside a transaction', async () => {
    await revokeCredential({ ...BASE, reason: 'document expired' });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('writes audit log with from_status and actor_id', async () => {
    await revokeCredential({ ...BASE, reason: 'document expired' });
    const auditValues = (mockTxInsert.mock.results[0]?.value as { values: AnyMock }).values?.mock?.calls[0]?.[0];
    expect(auditValues?.from_status).toBe('pending');
    expect(auditValues?.actor_id).toBe('mgr-1');
  });

  it('returns the updated credential', async () => {
    const result = await revokeCredential({ ...BASE, reason: 'document expired' });
    expect(result).toMatchObject({ user_id: 'user-1', credential_id: 'cred-1' });
  });
});
