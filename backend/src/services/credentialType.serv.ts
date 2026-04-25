import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { credentialTypes } from '../db/schema/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { CreateCredTypeInput, UpdateCredTypeInput } from '../utils/zod.js';
import { buildMetadataValidator } from '../utils/metadataValidator.js';

function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return JSON.stringify(obj);
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort().reduce((acc, key) => {
    acc[key] = (obj as Record<string, unknown>)[key];
    return acc;
  }, {} as Record<string, unknown>);
  return JSON.stringify(sorted, (_k, v) =>
    v !== null && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );
}

export const createCredentialType = async (orgId: string, input: CreateCredTypeInput) => {
  if (Object.keys(input.metadata_schema).length > 0) {
    buildMetadataValidator(input.metadata_schema); // throws AppError(400) if invalid
  }
  const [result] = await db.insert(credentialTypes).values({
    org_id: orgId,
    name: input.name,
    description: input.description,
    metadata_schema: input.metadata_schema,
    schema_version: 1,
  }).returning();

  return result;
};

export const listCredentialTypes = async (orgId: string, includeDeactivated: boolean) => {
  const condition = includeDeactivated
    ? eq(credentialTypes.org_id, orgId)
    : and(eq(credentialTypes.org_id, orgId), isNull(credentialTypes.deactivated_at));

  return db.select().from(credentialTypes).where(condition);
};

export const updateCredentialType = async (
  typeId: string,
  orgId: string,
  input: UpdateCredTypeInput
) => {
  const [current] = await db.select()
    .from(credentialTypes)
    .where(and(eq(credentialTypes.id, typeId), eq(credentialTypes.org_id, orgId)))
    .limit(1);

  if (!current) throw new NotFoundError();

  const schemaChanged =
    input.metadata_schema !== undefined &&
    canonicalize(input.metadata_schema) !== canonicalize(current.metadata_schema);

  if (input.metadata_schema !== undefined) {
    buildMetadataValidator(input.metadata_schema); // throws AppError(400) if invalid
  }

  const [result] = await db.update(credentialTypes)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.metadata_schema !== undefined && { metadata_schema: input.metadata_schema }),
      ...(schemaChanged && { schema_version: current.schema_version + 1 }),
    })
    .where(and(eq(credentialTypes.id, typeId), eq(credentialTypes.org_id, orgId)))
    .returning();

  return result;
};

export const deactivateCredentialType = async (typeId: string, orgId: string) => {
  const [result] = await db.update(credentialTypes)
    .set({ deactivated_at: sql`NOW()` })
    .where(and(
      eq(credentialTypes.id, typeId),
      eq(credentialTypes.org_id, orgId),
      isNull(credentialTypes.deactivated_at)
    ))
    .returning({ id: credentialTypes.id });

  if (!result) throw new NotFoundError();

  return result;
};