import { slugify, buildMetadataValidator } from '~/lib/utils/schema';

describe('slugify', () => {
  it('lowercases input', () => {
    expect(slugify('HELLO')).toBe('hello');
  });

  it('replaces spaces with underscores', () => {
    expect(slugify('hello world')).toBe('hello_world');
  });

  it('replaces special characters with underscores', () => {
    expect(slugify('Hello-World!')).toBe('hello_world');
  });

  it('collapses consecutive underscores into one', () => {
    expect(slugify('hello__world')).toBe('hello_world');
  });

  it('strips leading non-letter characters', () => {
    expect(slugify('123abc')).toBe('abc');
  });

  it('strips trailing underscores', () => {
    expect(slugify('hello_')).toBe('hello');
  });

  it('leaves an already-valid slug unchanged', () => {
    expect(slugify('hello_world')).toBe('hello_world');
  });

  it('empty string → empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('buildMetadataValidator (frontend)', () => {
  it('required string field — safeParse fails for empty string, passes for non-empty', () => {
    const v = buildMetadataValidator({
      fields: [{ key: 'name', label: 'Name', type: 'string', required: true }],
    });
    expect(v.safeParse({ name: '' }).success).toBe(false);
    expect(v.safeParse({ name: 'Alice' }).success).toBe(true);
  });

  it('optional string field — safeParse passes for undefined', () => {
    const v = buildMetadataValidator({
      fields: [{ key: 'nickname', label: 'Nickname', type: 'string', required: false }],
    });
    expect(v.safeParse({}).success).toBe(true);
  });

  it('number field — coerces string "42" to number 42', () => {
    const v = buildMetadataValidator({
      fields: [{ key: 'age', label: 'Age', type: 'number', required: true }],
    });
    const result = v.safeParse({ age: '42' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(42);
  });

  it('date field — rejects non-date string, accepts "YYYY-MM-DD"', () => {
    const v = buildMetadataValidator({
      fields: [{ key: 'dob', label: 'Date of Birth', type: 'date', required: true }],
    });
    expect(v.safeParse({ dob: 'not-a-date' }).success).toBe(false);
    expect(v.safeParse({ dob: '2026-01-15' }).success).toBe(true);
  });

  it('multiple fields — validates all fields together', () => {
    const v = buildMetadataValidator({
      fields: [
        { key: 'name', label: 'Name', type: 'string', required: true },
        { key: 'age', label: 'Age', type: 'number', required: true },
      ],
    });
    expect(v.safeParse({ name: 'Alice', age: 30 }).success).toBe(true);
    expect(v.safeParse({ name: '', age: 30 }).success).toBe(false);
  });

  it('empty fields array — validator accepts {}', () => {
    const v = buildMetadataValidator({ fields: [] });
    expect(v.safeParse({}).success).toBe(true);
  });
});
