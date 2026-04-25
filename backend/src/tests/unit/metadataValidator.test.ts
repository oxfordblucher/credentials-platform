import { describe, it, expect } from '@jest/globals';
import { buildMetadataValidator } from '../../utils/metadataValidator.js';
import { AppError } from '../../errors/AppError.js';

describe('buildMetadataValidator', () => {
  it('validates a required string field', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: { licenseNumber: { type: 'string' } },
      required: ['licenseNumber']
    });
    expect(validator.parse({ licenseNumber: 'ABC123' })).toEqual({ licenseNumber: 'ABC123' });
    expect(() => validator.parse({})).toThrow();
  });

  it('makes non-required fields optional', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: {
        notes: { type: 'string' }
      },
      required: []
    });
    expect(validator.parse({})).toEqual({});
  });

  it('validates number and integer fields', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: {
        score: { type: 'number' },
        rank: { type: 'integer' }
      },
      required: ['score', 'rank']
    });
    expect(validator.parse({ score: 9.5, rank: 3 })).toEqual({ score: 9.5, rank: 3 });
    expect(() => validator.parse({ score: 9.5, rank: 1.5 })).toThrow();
  });

  it('validates boolean fields', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: { active: { type: 'boolean' } },
      required: ['active']
    });
    expect(validator.parse({ active: true })).toEqual({ active: true });
    expect(() => validator.parse({ active: 'yes' })).toThrow();
  });

  it('validates array fields', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['tags']
    });
    expect(validator.parse({ tags: ['a', 'b'] })).toEqual({ tags: ['a', 'b'] });
    expect(() => validator.parse({ tags: 'not-an-array' })).toThrow();
  });

  it('validates enum fields', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: {
        grade: { enum: ['A', 'B', 'C'] }
      },
      required: ['grade']
    });
    expect(validator.parse({ grade: 'A' })).toEqual({ grade: 'A' });
    expect(() => validator.parse({ grade: 'D' })).toThrow();
  });

  it('coerces date-format strings to Date', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: {
        issued: { type: 'string', format: 'date' }
      },
      required: ['issued']
    });
    const result = validator.parse({ issued: '2024-01-15' }) as { issued: Date };
    expect(result.issued).toBeInstanceOf(Date);
  });

  it('throws AppError for unsupported type', () => {
    expect(() =>
      buildMetadataValidator({
        type: 'object',
        properties: { x: { type: 'null' } },
        required: ['x']
      })
    ).toThrow(AppError);
  });

  it('throws AppError when root is not an object schema', () => {
    expect(() =>
      buildMetadataValidator({ type: 'string' })
    ).toThrow(AppError);
  });

  it('handles empty properties (no required array)', () => {
    const validator = buildMetadataValidator({
      type: 'object',
      properties: {}
    });
    expect(validator.parse({})).toEqual({});
  });
});
