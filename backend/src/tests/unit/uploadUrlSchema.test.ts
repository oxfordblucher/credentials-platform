import { describe, it, expect } from '@jest/globals';
import { uploadUrlBodySchema, confirmUploadBodySchema, verifyBodySchema, rejectBodySchema, revokeBodySchema } from '../../utils/zod.js';

describe('uploadUrlBodySchema regex', () => {
  it.each([
    { input: { ext: 'JPG' }, expected: true, desc: 'uppercase' },
    { input: { ext: 'p/df' }, expected: false, desc: 'nonalphanumeric characters' },
    { input: { ext: 'toolongextension' }, expected: false, desc: 'max length' },
  ])('Validates $desc correctly', ({ input, expected }) => {
    const call = () => uploadUrlBodySchema.parse(input);
    if (expected) {
      expect(call).not.toThrow();
    } else {
      expect(call).toThrow();
    }
  });
});

describe('confirmUploadBodySchema', () => {
  it('accepts valid metadata object', () => {
    expect(() => confirmUploadBodySchema.parse({ submitted_metadata: { foo: 'bar' } })).not.toThrow();
  });
  it('rejects missing submitted_metadata', () => {
    expect(() => confirmUploadBodySchema.parse({})).toThrow();
  });
  it('rejects non-object submitted_metadata', () => {
    expect(() => confirmUploadBodySchema.parse({ submitted_metadata: 'string' })).toThrow();
  });
});

describe('verifyBodySchema', () => {
  it('accepts valid expiration_date and optional verified_metadata', () => {
    expect(() => verifyBodySchema.parse({ expiration_date: '2027-01-01' })).not.toThrow();
    expect(() => verifyBodySchema.parse({ expiration_date: '2027-01-01', verified_metadata: { k: 'v' } })).not.toThrow();
  });
  it('rejects missing expiration_date', () => {
    expect(() => verifyBodySchema.parse({})).toThrow();
  });
  it('rejects past expiration_date', () => {
    expect(() => verifyBodySchema.parse({ expiration_date: '2020-01-01' })).toThrow();
  });
});

describe('rejectBodySchema', () => {
  it('accepts rejection_reason_id and optional review_notes', () => {
    expect(() => rejectBodySchema.parse({ rejection_reason_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })).not.toThrow();
    expect(() => rejectBodySchema.parse({ rejection_reason_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', review_notes: 'bad doc' })).not.toThrow();
  });
  it('rejects missing rejection_reason_id', () => {
    expect(() => rejectBodySchema.parse({})).toThrow();
  });
  it('rejects non-UUID rejection_reason_id', () => {
    expect(() => rejectBodySchema.parse({ rejection_reason_id: 'not-a-uuid' })).toThrow();
  });
});

describe('revokeBodySchema', () => {
  it('accepts reason string', () => {
    expect(() => revokeBodySchema.parse({ reason: 'expired' })).not.toThrow();
  });
  it('rejects missing reason', () => {
    expect(() => revokeBodySchema.parse({})).toThrow();
  });
  it('rejects empty reason', () => {
    expect(() => revokeBodySchema.parse({ reason: '' })).toThrow();
  });
});
