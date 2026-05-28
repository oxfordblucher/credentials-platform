import { jest, describe, it, expect } from '@jest/globals';

jest.unstable_mockModule('../../db/index.js', () => ({
  db: { select: jest.fn(), transaction: jest.fn() },
}));
jest.unstable_mockModule('../../utils/s3.js', () => ({
  headObject: jest.fn(),
  getPutPresignedUrl: jest.fn(),
}));
jest.unstable_mockModule('../../utils/metadataValidator.js', () => ({
  buildMetadataValidator: jest.fn(() => ({ parse: jest.fn() })),
}));

const { db } = await import('../../db/index.js');
const { headObject } = await import('../../utils/s3.js');
const { confirmUpload } = await import('../../services/uploads.serv.js');

const VALID_TOKEN = {
  id: 'tok-1',
  object_key: 'orgs/org-1/users/u1/creds/ct1/uuid.jpg',
  user_id: 'u1',
  credential_type_id: 'ct1',
  expires_at: new Date(Date.now() + 900_000),
};

const VALID_CRED_TYPE = {
  id: 'ct1',
  org_id: 'org-1',
  metadata_schema: {},
};

const PARAMS: Parameters<typeof confirmUpload>[0] = {
  userId: 'u1',
  orgId: 'org-1',
  credentialTypeId: 'ct1',
  submittedMetadata: {},
};

function resetMocks({ existingCred }: { existingCred?: { status: string } } = {}) {
  jest.clearAllMocks();
  jest.mocked(headObject).mockResolvedValue({ contentType: 'application/pdf', contentLength: 1024 } as any);

  // Each call to .limit() returns the next row set in sequence:
  // 1st → uploadTokens, 2nd → credentialTypes, 3rd → userCredentials
  const selectResults = [
    [VALID_TOKEN],
    [VALID_CRED_TYPE],
    existingCred ? [existingCred] : [],
  ];
  let call = 0;
  const limit = jest.fn(() => Promise.resolve(selectResults[call++] ?? []));
  const where = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where }));
  jest.mocked(db.select).mockReturnValue({ from } as any);
}

describe('confirmUpload', () => {
  it('throws AppError 422 for disallowed MIME type', async () => {
    resetMocks();
    jest.mocked(headObject).mockResolvedValue({ contentType: 'text/html', contentLength: 500 } as any);
    await expect(confirmUpload(PARAMS)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws AppError 422 when file exceeds 10MB', async () => {
    resetMocks();
    jest.mocked(headObject).mockResolvedValue({ contentType: 'application/pdf', contentLength: 11 * 1024 * 1024 } as any);
    await expect(confirmUpload(PARAMS)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws ConflictError if existing credential is pending', async () => {
    resetMocks({ existingCred: { status: 'pending' } });
    const { ConflictError } = await import('../../errors/AppError.js');
    await expect(confirmUpload(PARAMS)).rejects.toThrow(ConflictError);
  });

  it('throws ConflictError if existing credential is active', async () => {
    resetMocks({ existingCred: { status: 'active' } });
    const { ConflictError } = await import('../../errors/AppError.js');
    await expect(confirmUpload(PARAMS)).rejects.toThrow(ConflictError);
  });
});
