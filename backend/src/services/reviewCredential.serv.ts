import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userCredentials, credentialAuditLog, credEnum, credentialTypes, teamMembers, teamCredentials } from '../db/schema/index.js';
import { ConflictError, PermissionError } from '../errors/AppError.js';
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

type ReviewBase = { actorId: string; userId: string; credentialTypeId: string; teamId: string };

const assertTeamScope = async (userId: string, teamId: string, credentialTypeId: string) => {
  const [member, teamCred] = await Promise.all([
    db.select({ user_id: teamMembers.user_id })
      .from(teamMembers)
      .where(and(eq(teamMembers.user_id, userId), eq(teamMembers.team_id, teamId)))
      .limit(1),
    db.select({ team_id: teamCredentials.team_id })
      .from(teamCredentials)
      .where(and(eq(teamCredentials.team_id, teamId), eq(teamCredentials.credential_id, credentialTypeId)))
      .limit(1),
  ]);

  if (!member[0]) throw new PermissionError('User is not a member of the specified team');
  if (!teamCred[0]) throw new PermissionError('Credential type is not assigned to the specified team');
};

export const verifyCredential = async ({
  actorId,
  userId,
  credentialTypeId,
  teamId,
  expiration_date,
  verified_metadata,
}: ReviewBase & { expiration_date: Date; verified_metadata?: Record<string, unknown> }) => {
  await assertTeamScope(userId, teamId, credentialTypeId);

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
  teamId,
  rejection_reason_id,
  review_notes,
}: ReviewBase & { rejection_reason_id: string; review_notes?: string }) => {
  await assertTeamScope(userId, teamId, credentialTypeId);

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
  teamId,
  reason,
}: ReviewBase & { reason: string }) => {
  await assertTeamScope(userId, teamId, credentialTypeId);

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
