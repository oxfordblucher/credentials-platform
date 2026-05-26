import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userCredentials, credentialAuditLog, credEnum, credentialTypes } from '../db/schema/index.js';
import { ConflictError } from '../errors/AppError.js';
import { computeNextAlertAt } from '../utils/expirationAlerts.js';
import { evtEmitter } from '../events/emitter.js';
import { Events } from '../events/event.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type CredentialStatus = typeof credEnum.enumValues[number];

type WriteStatusChangeParams = {
  userId: string;
  credentialId: string;
  actorId: string;
  fromStatus: CredentialStatus | null;
  toStatus: CredentialStatus;
  notes?: string;
};

const writeStatusChange = async (tx: Tx, params: WriteStatusChangeParams) => {
  await tx.insert(credentialAuditLog).values({
    user_id: params.userId,
    credential_id: params.credentialId,
    from_status: params.fromStatus,
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
  const [existing] = await db.select({ status: userCredentials.status })
    .from(userCredentials)
    .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
    .limit(1);

  const VALID_FROM_VERIFY = ['pending'];
  if (!existing || !VALID_FROM_VERIFY.includes(existing.status)) {
    throw new ConflictError(`Cannot verify a credential with status '${existing?.status ?? 'not found'}'`);
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx.update(userCredentials)
      .set({
        status: 'active',
        verified: sql`NOW()`,
        verifier_id: actorId,
        expiration_date,
        next_alert_at: expiration_date ? computeNextAlertAt(expiration_date) : null,
        verified_metadata: verified_metadata ?? null,
        rejection_reason_id: null,
        review_notes: null,
        revocation: null,
        revoker_id: null,
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

    return row;
  });

  const [credType] = await db.select({ name: credentialTypes.name })
    .from(credentialTypes).where(eq(credentialTypes.id, credentialTypeId)).limit(1);
  evtEmitter.emit(Events.CREDENTIAL_VERIFIED, { userId, credId: credentialTypeId, credName: credType?.name ?? '' });

  return updated;
};

export const rejectCredential = async ({
  actorId,
  userId,
  credentialTypeId,
  rejection_reason_id,
  review_notes,
}: ReviewBase & { rejection_reason_id: string; review_notes?: string }) => {
  const [existing] = await db.select({ status: userCredentials.status })
    .from(userCredentials)
    .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
    .limit(1);

  const VALID_FROM_REJECT = ['pending'];
  if (!existing || !VALID_FROM_REJECT.includes(existing.status)) {
    throw new ConflictError(`Cannot reject a credential with status '${existing?.status ?? 'not found'}'`);
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx.update(userCredentials)
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

    return row;
  });

  const [credType] = await db.select({ name: credentialTypes.name })
    .from(credentialTypes).where(eq(credentialTypes.id, credentialTypeId)).limit(1);
  evtEmitter.emit(Events.CREDENTIAL_REJECTED, {
    userId,
    credId: credentialTypeId,
    credName: credType?.name ?? '',
    rejectionReasonId: rejection_reason_id,
    reviewNotes: review_notes,
  });

  return updated;
};

export const revokeCredential = async ({
  actorId,
  userId,
  credentialTypeId,
  reason,
}: ReviewBase & { reason: string }) => {
  const [existing] = await db.select({ status: userCredentials.status })
    .from(userCredentials)
    .where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credentialTypeId)))
    .limit(1);

  const VALID_FROM_REVOKE = ['active'];
  if (!existing || !VALID_FROM_REVOKE.includes(existing.status)) {
    throw new ConflictError(`Cannot revoke a credential with status '${existing?.status ?? 'not found'}'`);
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx.update(userCredentials)
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

    return row;
  });

  const [credType] = await db.select({ name: credentialTypes.name })
    .from(credentialTypes).where(eq(credentialTypes.id, credentialTypeId)).limit(1);
  evtEmitter.emit(Events.CREDENTIAL_REVOKED, { userId, credId: credentialTypeId, credName: credType?.name ?? '' });

  return updated;
};
