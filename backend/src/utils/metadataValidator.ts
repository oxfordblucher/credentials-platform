import { z } from 'zod';
import { AppError } from '../errors/AppError.js';

type JsonSchemaProp = {
  type?: string;
  format?: string;
  items?: JsonSchemaProp;
  enum?: unknown[];
};

type JsonSchemaObject = {
  type: 'object';
  properties: Record<string, JsonSchemaProp>;
  required?: string[];
};

function buildPropSchema(key: string, prop: JsonSchemaProp): z.ZodTypeAny {
  if (prop.enum !== undefined) {
    if (!Array.isArray(prop.enum) || prop.enum.length === 0) {
      throw new AppError(400, `Unsupported schema field: ${key}`);
    }
    const [first, ...rest] = prop.enum as [string, ...string[]];
    return z.enum([first, ...rest]);
  }

  switch (prop.type) {
    case 'string':
      if (prop.format === 'date' || prop.format === 'date-time') {
        return z.coerce.date();
      }
      return z.string();
    case 'number':
      return z.number();
    case 'integer':
      return z.int();
    case 'boolean':
      return z.boolean();
    case 'array': {
      if (!prop.items) throw new AppError(400, `Unsupported schema field: ${key}`);
      return z.array(buildPropSchema(key, prop.items));
    }
    default:
      throw new AppError(400, `Unsupported schema field: ${key}`);
  }
}

export function buildMetadataValidator(schema: Record<string, unknown>): z.ZodTypeAny {
  if (schema.type !== 'object' || typeof schema.properties !== 'object' || schema.properties === null) {
    throw new AppError(400, 'Unsupported schema field: root');
  }

  const { properties, required } = schema as JsonSchemaObject;
  const requiredSet = new Set(required ?? []);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    const fieldSchema = buildPropSchema(key, prop);
    shape[key] = requiredSet.has(key) ? fieldSchema : fieldSchema.optional();
  }

  return z.object(shape);
}
