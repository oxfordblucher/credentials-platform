import { describe, it, expect } from '@jest/globals';
import { uploadUrlBodySchema } from '../../utils/zod.js';

describe('uploadUrlBodySchema', () => {
  it('accepts a valid alphanumeric extension', () => {
    expect(uploadUrlBodySchema.parse({ ext: 'pdf' })).toEqual({ ext: 'pdf' });
  });

  it('accepts uppercase extensions', () => {
    expect(uploadUrlBodySchema.parse({ ext: 'PDF' })).toEqual({ ext: 'PDF' });
  });

  it('rejects extension with a dot', () => {
    expect(() => uploadUrlBodySchema.parse({ ext: '.pdf' })).toThrow();
  });

  it('rejects extension with a slash', () => {
    expect(() => uploadUrlBodySchema.parse({ ext: 'p/df' })).toThrow();
  });

  it('rejects extension longer than 10 chars', () => {
    expect(() => uploadUrlBodySchema.parse({ ext: 'toolongextension' })).toThrow();
  });

  it('rejects missing ext field', () => {
    expect(() => uploadUrlBodySchema.parse({})).toThrow();
  });
});
