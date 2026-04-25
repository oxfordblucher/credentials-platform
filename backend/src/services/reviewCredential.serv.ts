import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userCredentials, credentialAuditLog } from '../db/schema/index.js';
import { NotFoundError } from '../errors/AppError.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type WriteStatusChangeParams = {
  userId: string;
  credentialId: string;
  actorId: string;
  fromStatus: string | null;
  toStatus: 'active' | 'rejected' | 'revoked';
  notes?: string;
};

const writeStatusChange = async (tx: Tx, params: WriteStatusChangeParams) => {
  await tx.insert(credentialAuditLog).values({
    user_id: params.userId,
    credential_id: params.credentialId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from_status: params.fromStatus as any,
    to_status: params.toStatus,
    actor_id: params.actorId,
    notes: params.notes,
  });
};

type ReviewBase = { actorId: string; userId: string; credentialTypeId: string };

export const verifyCredential = async ({
  actorId,
  userId,
  credentialTypeId,
  expiration_date,
  verified_metadata,
}: ReviewBase & { expiration_date: Date; verified_metadata?: Record<string, unknown> }) => {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ status: userCredentials.status })
      .from(userCredentials)
      .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
      .limit(1);

    if (!existing) throw new NotFoundError(`Credential ${credentialTypeId} for user ${userId} not found`);

    const [updated] = await tx.update(userCredentials)
      .set({
        status: 'active',
        verified: sql`NOW()`,
        verifier_id: actorId,
        expiration_date,
        verified_metadata: verified_metadata ?? null,
      })
      .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
      .returning();

    await writeStatusChange(tx, {
      userId,
      credentialId: credentialTypeId,
      actorId,
      fromStatus: existing.status,
      toStatus: 'active',
    });

    return updated;
  });
};

export const rejectCredential = async ({
  actorId,
  userId,
  credentialTypeId,
  rejection_reason_id,
  review_notes,
}: ReviewBase & { rejection_reason_id: string; review_notes?: string }) => {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ status: userCredentials.status })
      .from(userCredentials)
      .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
      .limit(1);

    if (!existing) throw new NotFoundError(`Credential ${credentialTypeId} for user ${userId} not found`);

    const [updated] = await tx.update(userCredentials)
      .set({ status: 'rejected', rejection_reason_id, review_notes: review_notes ?? null })
      .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
      .returning();

    await writeStatusChange(tx, {
      userId,
      credentialId: credentialTypeId,
      actorId,
      fromStatus: existing.status,
      toStatus: 'rejected',
      notes: review_notes,
    });

    return updated;
  });
};

export const revokeCredential = async ({
  actorId,
  userId,
  credentialTypeId,
  reason,
}: ReviewBase & { reason: string }) => {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ status: userCredentials.status })
      .from(userCredentials)
      .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
      .limit(1);

    if (!existing) throw new NotFoundError(`Credential ${credentialTypeId} for user ${userId} not found`);

    const [updated] = await tx.update(userCredentials)
      .set({ status: 'revoked', revocation: sql`NOW()`, revoker_id: actorId, review_notes: reason })
      .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
      .returning();

    await writeStatusChange(tx, {
      userId,
      credentialId: credentialTypeId,
      actorId,
      fromStatus: existing.status,
      toStatus: 'revoked',
      notes: reason,
    });

    return updated;
  });
};
