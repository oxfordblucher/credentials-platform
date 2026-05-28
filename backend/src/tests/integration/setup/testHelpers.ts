import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import {
  orgs,
  users,
  teamMembers,
  teams,
  credentialTypes,
  teamCredentials,
  userCredentials,
  rejectionReasons,
  credentialAuditLog,
  sessions,
  uploadTokens,
  notifications,
  invites,
} from '../../../db/schema/index.js';
import { signAccessToken } from '../../../utils/token.js';
import { app } from '../../../app.js';
import type { Transaction } from '../../../types/types.js';

export { app };

// ── Rollback sentinel ─────────────────────────────────────────────────────────

const ROLLBACK = Symbol('test-rollback');

/**
 * Runs fn inside a real DB transaction that is always rolled back at the end.
 * Keeps integration tests fully isolated without truncating tables.
 *
 * Usage:
 *   await withTestTransaction(async (tx) => {
 *     const result = await tx.insert(...).returning();
 *     expect(result).toHaveLength(1);
 *   });
 *   // DB is back to pre-test state here.
 */
export async function withTestTransaction<T>(
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  let captured: { value: T } | undefined;

  await db
    .transaction(async (tx) => {
      captured = { value: await fn(tx) };
      throw ROLLBACK;
    })
    .catch((err) => {
      if (err !== ROLLBACK) throw err;
    });

  return captured!.value;
}

// ── Test fixture helpers ──────────────────────────────────────────────────────

/**
 * Creates a minimal org + owner user, returns { orgId, ownerId, ownerToken }.
 * Inserted directly into the DB — use inside withTestTransaction for isolation.
 */
export async function createTestOrg(tx?: Transaction): Promise<{
  orgId: string;
  ownerId: string;
  ownerToken: string;
}> {
  const qb = tx ?? db;
  const orgId = randomUUID();
  const ownerId = randomUUID();
  const sessionId = randomUUID();

  // Insert org first (user's org_id FK must exist before inserting user).
  // orgs.owner_id has no FK constraint, so we can set it to the pre-generated UUID.
  await qb.insert(orgs).values({
    id: orgId,
    owner_id: ownerId,
    name: 'Test Org',
    address: '1 Test Street',
  });

  const passwordHash = await bcrypt.hash('testpassword', 1); // cost=1 for speed in tests
  await qb.insert(users).values({
    id: ownerId,
    first: 'Test',
    last: 'Owner',
    email: `owner-${ownerId.slice(0, 8)}@test.example`,
    password: passwordHash,
    org_id: orgId,
    org_role: 'owner',
    dob: new Date('1990-01-01'),
  });

  const ownerToken = signAccessToken({ id: ownerId, orgId, sessionId, orgRole: 'owner' });

  return { orgId, ownerId, ownerToken };
}

/**
 * Creates a plain user (no org-level role), optionally adds them to a team.
 * Returns { userId, token }.
 */
export async function createTestUser(
  orgId: string,
  role: 'manager' | 'member' = 'member',
  teamId?: string,
  tx?: Transaction,
): Promise<{ userId: string; token: string }> {
  const qb = tx ?? db;
  const userId = randomUUID();
  const sessionId = randomUUID();

  await qb.insert(users).values({
    id: userId,
    first: 'Test',
    last: 'User',
    email: `user-${userId.slice(0, 8)}@test.example`,
    password: await bcrypt.hash('testpassword', 1),
    org_id: orgId,
    org_role: null,
    dob: new Date('1990-01-01'),
  });

  if (teamId) {
    await qb.insert(teamMembers).values({
      user_id: userId,
      team_id: teamId,
      role,
    });
  }

  const token = signAccessToken({ id: userId, orgId, sessionId, orgRole: null });

  return { userId, token };
}

/**
 * Creates a user with org_role = 'admin'. Returns { userId, token }.
 */
export async function createTestAdmin(orgId: string, tx?: Transaction): Promise<{ userId: string; token: string }> {
  const qb = tx ?? db;
  const userId = randomUUID();
  const sessionId = randomUUID();

  await qb.insert(users).values({
    id: userId,
    first: 'Test',
    last: 'User',
    email: `user-${userId.slice(0, 8)}@test.example`,
    password: await bcrypt.hash('testpassword', 1),
    org_id: orgId,
    org_role: 'admin',
    dob: new Date('1990-01-01'),
  });

  const token = signAccessToken({ id: userId, orgId, sessionId, orgRole: 'admin' });

  return { userId, token };
}

export async function createTestTeam(orgId: string, managerId: string, tx?: Transaction): Promise<{ teamId: string }> {
  const qb = tx ?? db;
  const [row] = await qb
    .insert(teams)
    .values({ id: randomUUID(), org_id: orgId, manager_id: managerId, name: 'Test Team' })
    .returning();
  return { teamId: row.id };
}

export async function createTestCredentialType(
  orgId: string,
  overrides?: { name?: string; metadata_schema?: Record<string, unknown> },
  tx?: Transaction,
): Promise<{ credentialTypeId: string }> {
  const qb = tx ?? db;
  const [row] = await qb
    .insert(credentialTypes)
    .values({
      id: randomUUID(),
      org_id: orgId,
      name: overrides?.name ?? 'Test Credential-' + randomUUID().slice(0, 8),
      metadata_schema: overrides?.metadata_schema ?? {},
      schema_version: 1,
      deactivated_at: null,
    })
    .returning();
  return { credentialTypeId: row.id };
}

export async function assignCredentialToTeam(teamId: string, credentialTypeId: string, tx?: Transaction): Promise<void> {
  const qb = tx ?? db;
  await qb.insert(teamCredentials).values({ team_id: teamId, credential_id: credentialTypeId });
}

/**
 * Inserts the five standard rejection reasons. Safe to call multiple times.
 * Returns the ID of the DOCUMENT_EXPIRED reason for use in assertions.
 */
export async function seedRejectionReasons(tx?: Transaction): Promise<{ firstReasonId: string }> {
  const qb = tx ?? db;
  const SEED_REASONS = [
    { code: 'DOCUMENT_EXPIRED',   label: 'Document is expired' },
    { code: 'WRONG_TYPE',         label: 'Wrong credential type submitted' },
    { code: 'ILLEGIBLE',          label: 'Document is illegible or corrupted' },
    { code: 'METADATA_INCORRECT', label: 'Submitted information does not match document' },
    { code: 'OTHER',              label: 'Other — see review notes' },
  ];

  const existing = await qb.select().from(rejectionReasons).where(eq(rejectionReasons.code, 'DOCUMENT_EXPIRED')).limit(1);
  if (existing.length > 0) return { firstReasonId: existing[0].id };
  await qb.insert(rejectionReasons).values(SEED_REASONS.map(r => ({ id: randomUUID(), ...r })));
  const [row] = await qb.select().from(rejectionReasons).where(eq(rejectionReasons.code, 'DOCUMENT_EXPIRED')).limit(1);
  return { firstReasonId: row.id };
}

/**
 * Directly inserts a user_credentials row with status='pending' and a matching
 * audit_log entry (from_status=null, to_status='pending').
 * Returns { userId, credentialTypeId } for use in downstream DB assertions.
 */
export async function createPendingUserCredential(
  userId: string,
  credentialTypeId: string,
  opts?: { fileKey?: string; submittedMetadata?: Record<string, unknown>; actorId?: string },
  tx?: Transaction,
): Promise<{ userId: string; credentialTypeId: string }> {
  const run = async (qb: Transaction) => {
    await qb.insert(userCredentials).values({
      user_id: userId,
      credential_id: credentialTypeId,
      status: 'pending',
      file_key: opts?.fileKey,
      submitted_metadata: opts?.submittedMetadata,
    });
    await qb.insert(credentialAuditLog).values({
      id: randomUUID(),
      user_id: userId,
      credential_id: credentialTypeId,
      from_status: null,
      to_status: 'pending',
      actor_id: opts?.actorId ?? userId,
    });
  };

  if (tx) {
    await run(tx);
  } else {
    await db.transaction(run);
  }
  return { userId, credentialTypeId };
}

/**
 * Deletes all data associated with an org in FK-safe order.
 * Call in afterAll() of all HTTP integration test files.
 */
export async function cleanupTestOrg(orgId: string): Promise<void> {
  // 1. credential_audit_log
  await db.delete(credentialAuditLog).where(
    inArray(credentialAuditLog.user_id, db.select({ id: users.id }).from(users).where(eq(users.org_id, orgId)))
  );
  // 2. user_credentials
  await db.delete(userCredentials).where(
    inArray(userCredentials.user_id, db.select({ id: users.id }).from(users).where(eq(users.org_id, orgId)))
  );
  // 3. team_credentials
  await db.delete(teamCredentials).where(
    inArray(teamCredentials.team_id, db.select({ id: teams.id }).from(teams).where(eq(teams.org_id, orgId)))
  );
  // 4. credential_types
  await db.delete(credentialTypes).where(eq(credentialTypes.org_id, orgId));
  // 5. team_members
  await db.delete(teamMembers).where(
    inArray(teamMembers.team_id, db.select({ id: teams.id }).from(teams).where(eq(teams.org_id, orgId)))
  );
  // 6. upload_tokens
  await db.delete(uploadTokens).where(
    inArray(uploadTokens.user_id, db.select({ id: users.id }).from(users).where(eq(users.org_id, orgId)))
  );
  // 7. notifications
  await db.delete(notifications).where(
    inArray(notifications.user_id, db.select({ id: users.id }).from(users).where(eq(users.org_id, orgId)))
  );
  // 8. sessions
  await db.delete(sessions).where(
    inArray(sessions.user_id, db.select({ id: users.id }).from(users).where(eq(users.org_id, orgId)))
  );
  // 9. invites
  await db.delete(invites).where(eq(invites.org_id, orgId));
  // 10. teams
  await db.delete(teams).where(eq(teams.org_id, orgId));
  // 11. users
  await db.delete(users).where(eq(users.org_id, orgId));
  // 12. orgs
  await db.delete(orgs).where(eq(orgs.id, orgId));
}
