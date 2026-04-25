import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

// ── DB chain mocks ──────────────────────────────────────────────────
const mockDbSelect  = jest.fn() as AnyMock;

// Transaction mock: calls callback with mockTx
const mockTxSelect     = jest.fn() as AnyMock;
const mockTxInsert     = jest.fn() as AnyMock;
const mockTxDelete     = jest.fn() as AnyMock;

const mockTx = {
  select:  (...a: unknown[]) => mockTxSelect(...a),
  insert:  (...a: unknown[]) => mockTxInsert(...a),
  delete:  (...a: unknown[]) => mockTxDelete(...a),
};

const mockTransaction = jest.fn() as AnyMock;

const mockHeadObject = jest.fn() as AnyMock;
const mockBuildMetadataValidator = jest.fn() as AnyMock;

// ── ESM mocks ───────────────────────────────────────────────────────
jest.unstable_mockModule('../../db/index', () => ({
  db: {
    select: (...a: unknown[]) => mockDbSelect(...a),
    transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));

jest.unstable_mockModule('../../db/schema/index', () => ({
  uploadTokens:        { id: 'id', user_id: 'user_id', credential_type_id: 'credential_type_id', expires_at: 'expires_at', object_key: 'object_key' },
  userCredentials:     { user_id: 'user_id', credential_id: 'credential_id', status: 'status' },
  credentialTypes:     { id: 'id', metadata_schema: 'metadata_schema' },
  credentialAuditLog:  {},
}));

jest.unstable_mockModule('../../utils/s3', () => ({
  headObject: mockHeadObject,
}));

jest.unstable_mockModule('../../utils/metadataValidator', () => ({
  buildMetadataValidator: mockBuildMetadataValidator,
}));

jest.unstable_mockModule('drizzle-orm', () => ({
  and: (...args: unknown[]) => args,
  eq:  (_c: unknown, v: unknown) => v,
  gt:  (_c: unknown, v: unknown) => v,
}));

const { confirmUpload } = await import('../../services/confirmUpload.serv.js');

// ── Helpers ─────────────────────────────────────────────────────────
const PARAMS = {
  userId: 'user-1',
  orgId: 'org-1',
  credentialTypeId: 'cred-type-1',
  submittedMetadata: { license: 'ABC123' },
};

const MOCK_TOKEN = {
  id: 'token-id-1',
  object_key: 'orgs/o/users/u/creds/c/file.pdf',
  expires_at: new Date(Date.now() + 900_000),
};

const MOCK_CRED_TYPE = {
  id: 'cred-type-1',
  org_id: 'org-1',
  metadata_schema: { type: 'object', properties: { license: { type: 'string' } } },
};

function resetMocks({
  token = MOCK_TOKEN as typeof MOCK_TOKEN | null,
  credType = MOCK_CRED_TYPE as typeof MOCK_CRED_TYPE | null,
  existingCred = null as { status: string } | null,
  upserted = { user_id: 'user-1', credential_id: 'cred-type-1', status: 'pending' },
} = {}) {
  jest.clearAllMocks();

  // outer db.select chain: first call returns token, second returns credType
  let selectCallCount = 0;
  mockDbSelect.mockImplementation(() => {
    selectCallCount++;
    const result = selectCallCount === 1
      ? token ? [token] : []
      : credType ? [credType] : [];
    const mockLimitFn = jest.fn() as AnyMock;
    mockLimitFn.mockResolvedValue(result);
    const mockWhereFn = jest.fn() as AnyMock;
    mockWhereFn.mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = jest.fn() as AnyMock;
    mockFromFn.mockReturnValue({ where: mockWhereFn });
    return { from: mockFromFn };
  });

  // transaction calls callback with mockTx
  mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx));

  // tx.select → existing cred row
  const txLimitFn = jest.fn() as AnyMock;
  txLimitFn.mockResolvedValue(existingCred ? [existingCred] : []);
  const txWhereFn = jest.fn() as AnyMock;
  txWhereFn.mockReturnValue({ limit: txLimitFn });
  const txFromFn = jest.fn() as AnyMock;
  txFromFn.mockReturnValue({ where: txWhereFn });
  mockTxSelect.mockReturnValue({ from: txFromFn });

  // tx.insert: first call is upsert (returns upserted), second is audit log (returns [])
  let insertCallCount = 0;
  mockTxInsert.mockImplementation(() => {
    insertCallCount++;
    if (insertCallCount === 1) {
      const returningFn = jest.fn() as AnyMock;
      returningFn.mockResolvedValue([upserted]);
      const onConflictFn = jest.fn() as AnyMock;
      onConflictFn.mockReturnValue({ returning: returningFn });
      const valuesFn = jest.fn() as AnyMock;
      valuesFn.mockReturnValue({ onConflictDoUpdate: onConflictFn });
      return { values: valuesFn };
    }
    const valuesFn = jest.fn() as AnyMock;
    valuesFn.mockResolvedValue([]);
    return { values: valuesFn };
  });

  // tx.delete chain
  const deletWhereFn = jest.fn() as AnyMock;
  deletWhereFn.mockResolvedValue([]);
  mockTxDelete.mockReturnValue({ where: deletWhereFn });

  // metadata validator: parse is a no-op by default
  mockBuildMetadataValidator.mockReturnValue({ parse: jest.fn() });

  mockHeadObject.mockResolvedValue(undefined);
}

// ── Tests ────────────────────────────────────────────────────────────
describe('confirmUpload', () => {
  beforeEach(() => resetMocks());

  it('throws 404 if no active upload token found', async () => {
    resetMocks({ token: null });
    const { NotFoundError } = await import('../../errors/AppError.js');
    await expect(confirmUpload(PARAMS)).rejects.toThrow(NotFoundError);
  });

  it('calls headObject with the token object_key', async () => {
    await confirmUpload(PARAMS);
    expect(mockHeadObject).toHaveBeenCalledWith(MOCK_TOKEN.object_key);
  });

  it('propagates headObject errors (e.g. 422)', async () => {
    const { AppError } = await import('../../errors/AppError.js');
    mockHeadObject.mockRejectedValue(new AppError(422, 'File not found in storage'));
    await expect(confirmUpload(PARAMS)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws 404 if credential type not found', async () => {
    resetMocks({ credType: null });
    const { NotFoundError } = await import('../../errors/AppError.js');
    await expect(confirmUpload(PARAMS)).rejects.toThrow(NotFoundError);
  });

  it('throws 404 if credential type belongs to a different org', async () => {
    resetMocks({ credType: { ...MOCK_CRED_TYPE, org_id: 'other-org' } });
    const { NotFoundError } = await import('../../errors/AppError.js');
    await expect(confirmUpload(PARAMS)).rejects.toThrow(NotFoundError);
  });

  it('validates submitted_metadata against the credential type schema', async () => {
    const mockParse = jest.fn();
    mockBuildMetadataValidator.mockReturnValue({ parse: mockParse });
    await confirmUpload(PARAMS);
    expect(mockBuildMetadataValidator).toHaveBeenCalledWith(MOCK_CRED_TYPE.metadata_schema);
    expect(mockParse).toHaveBeenCalledWith(PARAMS.submittedMetadata);
  });

  it('throws if metadata validation fails', async () => {
    const mockParse = jest.fn().mockImplementation(() => { throw new Error('invalid metadata'); });
    mockBuildMetadataValidator.mockReturnValue({ parse: mockParse });
    await expect(confirmUpload(PARAMS)).rejects.toThrow('invalid metadata');
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('runs a transaction', async () => {
    await confirmUpload(PARAMS);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('returns the upserted credential', async () => {
    const result = await confirmUpload(PARAMS);
    expect(result).toMatchObject({ user_id: 'user-1', status: 'pending' });
  });

  it('passes from_status=null for a new credential', async () => {
    await confirmUpload(PARAMS);
    const auditValuesArg = (mockTxInsert.mock.results[1]?.value as { values: AnyMock }).values?.mock?.calls[0]?.[0];
    expect(auditValuesArg?.from_status).toBeNull();
  });

  it('passes from_status of existing credential when re-submitting', async () => {
    resetMocks({ existingCred: { status: 'rejected' } });
    await confirmUpload(PARAMS);
    const auditValuesArg = (mockTxInsert.mock.results[1]?.value as { values: AnyMock }).values?.mock?.calls[0]?.[0];
    expect(auditValuesArg?.from_status).toBe('rejected');
  });
});
