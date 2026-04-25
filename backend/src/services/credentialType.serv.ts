import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { credentialTypes } from '../db/schema/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { CreateCredTypeInput, UpdateCredTypeInput } from '../utils/zod.js';

export const createCredentialType = async (orgId: string, input: CreateCredTypeInput) => {
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
    JSON.stringify(input.metadata_schema) !== JSON.stringify(current.metadata_schema);

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
    .where(and(eq(credentialTypes.id, typeId), eq(credentialTypes.org_id, orgId)))
    .returning({ id: credentialTypes.id });

  if (!result) throw new NotFoundError();

  return result;
};
