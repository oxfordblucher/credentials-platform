import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../../../db/index.js';
import { orgs, users, teamMembers } from '../../../db/schema/index.js';
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
export async function createTestOrg(): Promise<{
  orgId: string;
  ownerId: string;
  ownerToken: string;
}> {
  const orgId = randomUUID();
  const ownerId = randomUUID();
  const sessionId = randomUUID();

  // Insert org first (user's org_id FK must exist before inserting user).
  // orgs.owner_id has no FK constraint, so we can set it to the pre-generated UUID.
  await db.insert(orgs).values({
    id: orgId,
    owner_id: ownerId,
    name: 'Test Org',
    address: '1 Test Street',
  });

  const passwordHash = await bcrypt.hash('testpassword', 1); // cost=1 for speed in tests
  await db.insert(users).values({
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
): Promise<{ userId: string; token: string }> {
  const userId = randomUUID();
  const sessionId = randomUUID();

  await db.insert(users).values({
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
    await db.insert(teamMembers).values({
      user_id: userId,
      team_id: teamId,
      role,
    });
  }

  const token = signAccessToken({ id: userId, orgId, sessionId, orgRole: null });

  return { userId, token };
}
