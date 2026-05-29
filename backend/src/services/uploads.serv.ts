import { randomUUID } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { uploadTokens, userCredentials, credentialTypes, credentialAuditLog } from '../db/schema/index.js';
import { getPutPresignedUrl, headObject } from '../utils/s3.js';
import { buildMetadataValidator } from '../utils/metadataValidator.js';
import { AppError, RateLimitError, NotFoundError, ConflictError } from '../errors/AppError.js';
import { evtEmitter } from '../events/emitter.js';
import { Events } from '../events/event.js';

type GenerateUploadUrlParams = {
  orgId: string;
  userId: string;
  credentialTypeId: string;
  ext: string;
};

export const generateUploadUrl = async (params: GenerateUploadUrlParams) => {
  const { orgId, userId, credentialTypeId, ext } = params;

  const [existing] = await db.select()
    .from(uploadTokens)
    .where(
      and(
        eq(uploadTokens.user_id, userId),
        gt(uploadTokens.expires_at, new Date())
      )
    )
    .limit(1);

  if (existing) throw new RateLimitError();

  const objectKey = `orgs/${orgId}/users/${userId}/creds/${credentialTypeId}/${randomUUID()}.${ext}`;
  const expiresAt = new Date(Date.now() + 900_000); // 15 minutes

  const [token] = await db.insert(uploadTokens)
    .values({ user_id: userId, credential_type_id: credentialTypeId, object_key: objectKey, expires_at: expiresAt })
    .returning();

  const presignedUrl = await getPutPresignedUrl(token.object_key, 900);

  return { presigned_url: presignedUrl, object_key: token.object_key };
};

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

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

  const { contentType, contentLength } = await headObject(token.object_key);

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new AppError(422, `Unsupported file type: ${contentType}. Allowed: jpeg, png, pdf`);
  }
  if (contentLength > MAX_FILE_BYTES) {
    throw new AppError(422, `File size ${contentLength} exceeds 10MB limit`);
  }

  const [credType] = await db.select()
    .from(credentialTypes)
    .where(eq(credentialTypes.id, credentialTypeId))
    .limit(1);

  if (!credType) throw new NotFoundError('Credential type not found');

  if (credType.org_id !== orgId) throw new NotFoundError('Credential type not found');

  const validator = buildMetadataValidator(credType.metadata_schema as Record<string, unknown>);
  validator.parse(submittedMetadata);

  const [existing] = await db.select({ status: userCredentials.status })
    .from(userCredentials)
    .where(and(
      eq(userCredentials.user_id, userId),
      eq(userCredentials.credential_id, credentialTypeId),
    ))
    .limit(1);

  if (existing?.status === 'pending' || existing?.status === 'active') {
    throw new ConflictError('Credential already in pending or active state');
  }

  const result = await db.transaction(async (tx) => {
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

  evtEmitter.emit(Events.CREDENTIAL_SUBMITTED, { userId, credId: credentialTypeId, credName: credType.name });

  return result;
};
