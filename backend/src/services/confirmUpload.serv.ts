import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { uploadTokens, userCredentials, credentialTypes, credentialAuditLog } from '../db/schema/index.js';
import { headObject } from '../utils/s3.js';
import { buildMetadataValidator } from '../utils/metadataValidator.js';
import { NotFoundError } from '../errors/AppError.js';

type ConfirmUploadParams = {
  userId: string;
  orgId: string;
  credentialTypeId: string;
  submittedMetadata: Record<string, unknown>;
};

export const confirmUpload = async ({ userId, orgId, credentialTypeId, submittedMetadata }: ConfirmUploadParams) => {
  const [token] = await db.select()
    .from(uploadTokens)
    .where(and(
      eq(uploadTokens.user_id, userId),
      eq(uploadTokens.credential_type_id, credentialTypeId),
      gt(uploadTokens.expires_at, new Date()),
    ))
    .limit(1);

  if (!token) throw new NotFoundError('No active upload token found');

  await headObject(token.object_key);

  const [credType] = await db.select()
    .from(credentialTypes)
    .where(eq(credentialTypes.id, credentialTypeId))
    .limit(1);

  if (!credType) throw new NotFoundError('Credential type not found');

  if (credType.org_id !== orgId) throw new NotFoundError('Credential type not found');

  const validator = buildMetadataValidator(credType.metadata_schema as Record<string, unknown>);
  validator.parse(submittedMetadata);

  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ status: userCredentials.status })
      .from(userCredentials)
      .where(and(
        eq(userCredentials.user_id, userId),
        eq(userCredentials.credential_id, credentialTypeId),
      ))
      .limit(1);

    const now = new Date();
    const [upserted] = await tx.insert(userCredentials)
      .values({
        user_id: userId,
        credential_id: credentialTypeId,
        file_key: token.object_key,
        submitted_metadata: submittedMetadata,
        status: 'pending',
        submitted: now,
      })
      .onConflictDoUpdate({
        target: [userCredentials.user_id, userCredentials.credential_id],
        set: {
          file_key: token.object_key,
          submitted_metadata: submittedMetadata,
          status: 'pending',
          submitted: now,
        },
      })
      .returning();

    await tx.insert(credentialAuditLog).values({
      user_id: userId,
      credential_id: credentialTypeId,
      from_status: existing?.status ?? null,
      to_status: 'pending',
      actor_id: userId,
    });

    await tx.delete(uploadTokens)
      .where(eq(uploadTokens.id, token.id));

    return upserted;
  });
};
