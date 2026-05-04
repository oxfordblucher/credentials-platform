import { z } from 'zod';
import type { MetadataSchema } from '~/lib/types';

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+/g, '_')
    .replace(/_+$/, '');
}

export function buildMetadataValidator(schema: MetadataSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of schema.fields) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (field.type === 'string') {
      shape[field.key] = field.required
        ? z.string().min(1)
        : z.string().optional();
    } else if (field.type === 'number') {
      shape[field.key] = field.required
        ? z.coerce.number()
        : z.coerce.number().optional();
    } else if (field.type === 'date') {
      const dateSchema = z.string().regex(datePattern);
      shape[field.key] = field.required ? dateSchema : dateSchema.optional();
    }
  }

  return z.object(shape);
}
