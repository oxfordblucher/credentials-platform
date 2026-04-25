import { describe, it, expect } from '@jest/globals';
import { uploadUrlBodySchema } from '../../utils/zod.js';

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