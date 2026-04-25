import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

// ------------------------------------------------------------------
// Build DB chain mocks (must exist before module mock factories run)
// ------------------------------------------------------------------
const mockLimit    = jest.fn() as AnyMock;
const mockWhere    = jest.fn() as AnyMock;
const mockFrom     = jest.fn() as AnyMock;
const mockReturning = jest.fn() as AnyMock;
const mockValues   = jest.fn() as AnyMock;
const mockDbSelect = jest.fn() as AnyMock;
const mockDbInsert = jest.fn() as AnyMock;

const mockGetPutPresignedUrl = jest.fn() as AnyMock;

// ------------------------------------------------------------------
// ESM module mocks — must use unstable_mockModule + dynamic import
// ------------------------------------------------------------------
jest.unstable_mockModule('../../utils/s3', () => ({
  getPutPresignedUrl: mockGetPutPresignedUrl,
}));

jest.unstable_mockModule('../../db/index', () => ({
  db: {
    select: (...a: unknown[]) => mockDbSelect(...a),
    insert: (...a: unknown[]) => mockDbInsert(...a),
  },
}));

jest.unstable_mockModule('../../db/schema/index', () => ({
  uploadTokens: {},
}));

jest.unstable_mockModule('drizzle-orm', () => ({
  and: (...args: unknown[]) => args,
  eq:  (_c: unknown, v: unknown) => v,
  gt:  (_c: unknown, v: unknown) => v,
}));

// Dynamic import AFTER mocks are registered
const { generateUploadUrl } = await import('../../services/uploadUrl.serv.js');

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const BASE_PARAMS = { orgId: 'org-1', userId: 'user-1', credentialTypeId: 'cred-1', ext: 'pdf' };

const makeToken = (overrides: Record<string, unknown> = {}) => ({
  id: 'token-id-1',
  object_key: 'orgs/org-1/users/user-1/creds/cred-1/some-uuid.pdf',
  expires_at: new Date(Date.now() + 900_000),
  ...overrides,
});

function resetDbMocks(activeTokens: unknown[] = [], token: unknown = makeToken()) {
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue(activeTokens);
  mockDbSelect.mockReturnValue({ from: mockFrom });

  mockReturning.mockResolvedValue([token]);
  mockValues.mockReturnValue({ returning: mockReturning });
  mockDbInsert.mockReturnValue({ values: mockValues });
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe('generateUploadUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPutPresignedUrl.mockResolvedValue('https://s3.example.com/presigned-url');
    resetDbMocks();
  });

  it('throws RateLimitError (429) when an active token exists', async () => {
    resetDbMocks([{ id: 'existing', expires_at: new Date(Date.now() + 300_000) }]);
    const { RateLimitError } = await import('../../errors/AppError.js');
    await expect(generateUploadUrl(BASE_PARAMS)).rejects.toThrow(RateLimitError);
  });

  it('does not call insert or presigner when blocked', async () => {
    resetDbMocks([{ id: 'existing' }]);
    await generateUploadUrl(BASE_PARAMS).catch(() => {});
    expect(mockDbInsert).not.toHaveBeenCalled();
    expect(mockGetPutPresignedUrl).not.toHaveBeenCalled();
  });

  it('builds object_key in the strict format', async () => {
    let capturedKey = '';
    mockValues.mockImplementation((vals: Record<string, unknown>) => {
      capturedKey = vals.object_key as string;
      const ret = jest.fn() as AnyMock;
      ret.mockResolvedValue([makeToken({ object_key: capturedKey })]);
      return { returning: ret };
    });

    const result = await generateUploadUrl(BASE_PARAMS);

    expect(result.object_key).toMatch(
      /^orgs\/org-1\/users\/user-1\/creds\/cred-1\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/
    );
    expect(result.object_key).toBe(capturedKey);
  });

  it('inserts a new token with 15-minute expiry', async () => {
    const before = Date.now();
    let capturedExpiry!: Date;

    mockValues.mockImplementation((vals: Record<string, unknown>) => {
      capturedExpiry = vals.expires_at as Date;
      const ret = jest.fn() as AnyMock;
      ret.mockResolvedValue([makeToken({ object_key: vals.object_key, expires_at: vals.expires_at })]);
      return { returning: ret };
    });

    await generateUploadUrl(BASE_PARAMS);

    expect(capturedExpiry.getTime() - before).toBeGreaterThanOrEqual(899_000);
    expect(capturedExpiry.getTime() - before).toBeLessThanOrEqual(901_000);
  });

  it('calls getPutPresignedUrl with the object_key and 900s TTL', async () => {
    let capturedKey = '';
    mockValues.mockImplementation((vals: Record<string, unknown>) => {
      capturedKey = vals.object_key as string;
      const ret = jest.fn() as AnyMock;
      ret.mockResolvedValue([makeToken({ object_key: capturedKey })]);
      return { returning: ret };
    });

    await generateUploadUrl(BASE_PARAMS);

    expect(mockGetPutPresignedUrl).toHaveBeenCalledWith(capturedKey, 900);
  });

  it('returns presigned_url and object_key', async () => {
    const result = await generateUploadUrl(BASE_PARAMS);
    expect(result).toMatchObject({
      presigned_url: 'https://s3.example.com/presigned-url',
      object_key: expect.any(String),
    });
  });
});
