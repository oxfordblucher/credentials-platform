import { randomUUID } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { uploadTokens } from '../db/schema/index.js';
import { RateLimitError } from '../errors/AppError.js';
import { getPutPresignedUrl } from '../utils/s3.js';

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
