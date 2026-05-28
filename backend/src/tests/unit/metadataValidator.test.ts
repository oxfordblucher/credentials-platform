import { describe, it, expect } from '@jest/globals';
import { AppError } from '../../errors/AppError.js';

const { buildMetadataValidator } = await import('../../utils/metadataValidator.js');

function expectAppError400(fn: () => unknown) {
  let error: AppError | undefined;
  try {
    fn();
  } catch (e) {
    error = e as AppError;
  }
  expect(error).toBeInstanceOf(AppError);
  expect(error?.statusCode).toBe(400);
}

describe('buildMetadataValidator', () => {
  describe('valid schemas', () => {
    it('accepts a valid object with all required string fields present', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { license_number: { type: 'string' } },
        required: ['license_number'],
      });
      const result = validator.safeParse({ license_number: 'ABC-123' });
      expect(result.success).toBe(true);
    });

    it('rejects an object missing a required string field', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { license_number: { type: 'string' } },
        required: ['license_number'],
      });
      const result = validator.safeParse({});
      expect(result.success).toBe(false);
    });

    it('string field without required → accepts missing field (optional)', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { nickname: { type: 'string' } },
      });
      const result = validator.safeParse({});
      expect(result.success).toBe(true);
    });

    it('number field → accepts numeric value, rejects string', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { score: { type: 'number' } },
        required: ['score'],
      });
      expect(validator.safeParse({ score: 9.5 }).success).toBe(true);
      expect(validator.safeParse({ score: 'nine' }).success).toBe(false);
    });

    it('integer field → accepts integer value', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { count: { type: 'integer' } },
        required: ['count'],
      });
      expect(validator.safeParse({ count: 5 }).success).toBe(true);
    });

    it('boolean field → accepts true/false', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { active: { type: 'boolean' } },
        required: ['active'],
      });
      expect(validator.safeParse({ active: true }).success).toBe(true);
      expect(validator.safeParse({ active: false }).success).toBe(true);
    });

    it('date string field with format=date → coerces to Date', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { dob: { type: 'string', format: 'date' } },
        required: ['dob'],
      });
      const result = validator.safeParse({ dob: '2024-06-15' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { dob: unknown }).dob).toBeInstanceOf(Date);
      }
    });

    it('enum field → accepts valid value, rejects non-member', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { color: { enum: ['red', 'green', 'blue'] } },
        required: ['color'],
      });
      expect(validator.safeParse({ color: 'red' }).success).toBe(true);
      expect(validator.safeParse({ color: 'yellow' }).success).toBe(false);
    });

    it('array field with items.type=string → accepts string array, rejects non-array', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: { tags: { type: 'array', items: { type: 'string' } } },
        required: ['tags'],
      });
      expect(validator.safeParse({ tags: ['a', 'b', 'c'] }).success).toBe(true);
      expect(validator.safeParse({ tags: 'not-an-array' }).success).toBe(false);
    });

    it('empty properties object → accepts empty object {}', () => {
      const validator = buildMetadataValidator({
        type: 'object',
        properties: {},
      });
      expect(validator.safeParse({}).success).toBe(true);
    });
  });

  describe('invalid/unsupported schemas — each must throw AppError(400)', () => {
    it('root type is not "object"', () => {
      expectAppError400(() => buildMetadataValidator({ type: 'string' }));
    });

    it('properties key is missing', () => {
      expectAppError400(() => buildMetadataValidator({ type: 'object' }));
    });

    it('field type is "object" (nested objects unsupported)', () => {
      expectAppError400(() =>
        buildMetadataValidator({
          type: 'object',
          properties: { nested: { type: 'object' } },
        }),
      );
    });

    it('field type is unknown (e.g. "foo")', () => {
      expectAppError400(() =>
        buildMetadataValidator({
          type: 'object',
          properties: { x: { type: 'foo' } },
        }),
      );
    });

    it('enum is empty array', () => {
      expectAppError400(() =>
        buildMetadataValidator({
          type: 'object',
          properties: { color: { enum: [] } },
        }),
      );
    });

    it('enum values contain non-strings', () => {
      expectAppError400(() =>
        buildMetadataValidator({
          type: 'object',
          properties: { code: { enum: [1, 2, 3] } },
        }),
      );
    });

    it('array field has no items definition', () => {
      expectAppError400(() =>
        buildMetadataValidator({
          type: 'object',
          properties: { tags: { type: 'array' } },
        }),
      );
    });
  });
});
