import { jest } from '@jest/globals';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  userCredentials,
  credentialAuditLog,
  uploadTokens,
} from '../../db/schema/index.js';

// ESM-compatible mock — must be called before testHelpers (which imports app → s3) is loaded.
jest.unstable_mockModule('../../utils/s3.js', () => ({
  getPutPresignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/mock-presigned-url'),
  headObject: jest.fn().mockResolvedValue(undefined),
  getGetPresignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/mock-view-url'),
}));

const {
  app,
  createTestOrg,
  createTestUser,
  createTestTeam,
  createTestCredentialType,
  assignCredentialToTeam,
  seedRejectionReasons,
  createPendingUserCredential,
  cleanupTestOrg,
} = await import('./setup/testHelpers.js');

const WITH_FIELD_SCHEMA = {
  type: 'object',
  properties: { license_number: { type: 'string' } },
  required: ['license_number'],
};

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

describe('Credential workflow — full lifecycle', () => {
  let orgId: string;
  let ownerId: string;
  let ownerToken: string;
  let teamId: string;
  let managerId: string;
  let memberId: string;
  let memberToken: string;
  let credentialTypeId: string;
  let credentialTypeWithFieldId: string;
  let firstReasonId: string;

  beforeAll(async () => {
    ({ orgId, ownerId, ownerToken } = await createTestOrg());
    ({ teamId } = await createTestTeam(orgId, ownerId));
    ({ userId: managerId } = await createTestUser(orgId, 'manager', teamId));
    ({ userId: memberId, token: memberToken } = await createTestUser(orgId, 'member', teamId));
    ({ credentialTypeId } = await createTestCredentialType(orgId));
    await assignCredentialToTeam(teamId, credentialTypeId);
    ({ firstReasonId } = await seedRejectionReasons());
    ({ credentialTypeId: credentialTypeWithFieldId } = await createTestCredentialType(orgId, {
      metadata_schema: WITH_FIELD_SCHEMA,
    }));
  });

  afterAll(async () => {
    await cleanupTestOrg(orgId);
  });

  async function cleanMemberCredential(userId: string, ctId: string) {
    await db.delete(credentialAuditLog).where(
      and(eq(credentialAuditLog.user_id, userId), eq(credentialAuditLog.credential_id, ctId)),
    );
    await db.delete(userCredentials).where(
      and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, ctId)),
    );
  }

  // ── GET /api/credentials ──────────────────────────────────────────────────

  describe('GET /api/credentials (member view)', () => {
    it('200 — returns required credential entry for memberId with correct credential_type and status', async () => {
      const res = await request(app)
        .get('/api/credentials')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const credentials = res.body.credentials as Array<{
        credential_type: { id: string };
        status: string;
      }>;
      const entry = credentials.find((c) => c.credential_type.id === credentialTypeId);
      expect(entry).toBeDefined();
      expect(entry!.status).toBe('missing');
    });

    it('401 — unauthenticated request', async () => {
      const res = await request(app).get('/api/credentials');
      expect(res.status).toBe(401);
    });
  });

  // ── Upload URL ────────────────────────────────────────────────────────────

  describe('Upload URL — POST /api/credentials/:credentialTypeId/upload-url', () => {
    afterEach(async () => {
      await db.delete(uploadTokens).where(eq(uploadTokens.user_id, memberId));
    });

    it('200 — returns upload_url and object_key', async () => {
      const res = await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });

      expect(res.status).toBe(200);
      expect(res.body.presigned_url).toBeDefined();
      expect(res.body.object_key).toBeDefined();
    });

    it('400 — unsupported content_type (e.g. "text/html")', async () => {
      const res = await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'text/html' });

      expect(res.status).toBe(400);
    });
  });

  // ── Confirm upload ────────────────────────────────────────────────────────

  describe('Confirm upload — POST /api/credentials/:credentialTypeId/confirm-upload', () => {
    afterEach(async () => {
      await cleanMemberCredential(memberId, credentialTypeId);
      await cleanMemberCredential(memberId, credentialTypeWithFieldId);
      await db.delete(uploadTokens).where(eq(uploadTokens.user_id, memberId));
    });

    it('200 — creates user_credentials row with status=pending', async () => {
      await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });

      const res = await request(app)
        .post(`/api/credentials/${credentialTypeId}/confirm-upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ submitted_metadata: {} });

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(row).toBeDefined();
      expect(row.status).toBe('pending');
    });

    it('200 — audit_log has exactly 1 row: from_status=null, to_status=pending, actor_id=memberId', async () => {
      await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });

      await request(app)
        .post(`/api/credentials/${credentialTypeId}/confirm-upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ submitted_metadata: {} });

      const rows = await db
        .select()
        .from(credentialAuditLog)
        .where(
          and(
            eq(credentialAuditLog.user_id, memberId),
            eq(credentialAuditLog.credential_id, credentialTypeId),
          ),
        );
      expect(rows).toHaveLength(1);
      expect(rows[0].from_status).toBeNull();
      expect(rows[0].to_status).toBe('pending');
      expect(rows[0].actor_id).toBe(memberId);
    });

    it('409 — second confirm on same credential when already pending', async () => {
      // First upload-url + confirm-upload → creates pending row
      await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });
      await request(app)
        .post(`/api/credentials/${credentialTypeId}/confirm-upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ submitted_metadata: {} });

      // Second upload-url → new token
      await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });

      // Second confirm-upload → 409 because already pending
      const res = await request(app)
        .post(`/api/credentials/${credentialTypeId}/confirm-upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ submitted_metadata: {} });

      expect(res.status).toBe(409);
    });

    it('400 — metadata validation fails when required field is missing', async () => {
      await request(app)
        .post(`/api/credentials/${credentialTypeWithFieldId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });

      const res = await request(app)
        .post(`/api/credentials/${credentialTypeWithFieldId}/confirm-upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ submitted_metadata: {} });

      expect(res.status).toBe(400);
    });
  });

  // ── Verify ────────────────────────────────────────────────────────────────

  describe('Verify — PATCH /api/teams/:teamId/users/:userId/credentials/:credentialTypeId/verify', () => {
    beforeEach(async () => {
      await createPendingUserCredential(memberId, credentialTypeId, { actorId: memberId });
    });

    afterEach(async () => {
      await cleanMemberCredential(memberId, credentialTypeId);
    });

    it('200 — status transitions to active in DB', async () => {
      const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ expiration_date: expirationDate.toISOString() });

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(row.status).toBe('active');
    });

    it('200 — audit_log has exactly 2 rows: [pending entry, active entry]', async () => {
      const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ expiration_date: expirationDate.toISOString() });

      expect(res.status).toBe(200);

      const rows = await db
        .select()
        .from(credentialAuditLog)
        .where(
          and(
            eq(credentialAuditLog.user_id, memberId),
            eq(credentialAuditLog.credential_id, credentialTypeId),
          ),
        );
      expect(rows).toHaveLength(2);

      const sorted = rows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      expect(sorted[0].from_status).toBeNull();
      expect(sorted[0].to_status).toBe('pending');
      expect(sorted[1].from_status).toBe('pending');
      expect(sorted[1].to_status).toBe('active');
    });

    it('200 — next_alert_at is set when expiration_date is provided and > 30 days away', async () => {
      const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ expiration_date: expirationDate.toISOString() });

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(row.next_alert_at).not.toBeNull();
      expect(row.next_alert_at!.getTime()).toBeGreaterThan(Date.now());
    });

    it('409 — cannot verify a credential already in active status', async () => {
      const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ expiration_date: expirationDate.toISOString() });

      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ expiration_date: expirationDate.toISOString() });

      expect(res.status).toBe(409);
    });
  });

  // ── Reject ────────────────────────────────────────────────────────────────

  describe('Reject — PATCH /api/teams/:teamId/users/:userId/credentials/:credentialTypeId/reject', () => {
    beforeEach(async () => {
      await createPendingUserCredential(memberId, credentialTypeId, { actorId: memberId });
    });

    afterEach(async () => {
      await cleanMemberCredential(memberId, credentialTypeId);
    });

    it('200 — status transitions to rejected in DB', async () => {
      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rejection_reason_id: firstReasonId, review_notes: 'Test rejection' });

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(row.status).toBe('rejected');
    });

    it('200 — rejection_reason_id and review_notes set on user_credentials row', async () => {
      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rejection_reason_id: firstReasonId, review_notes: 'Test rejection notes' });

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(row.rejection_reason_id).toBe(firstReasonId);
      expect(row.review_notes).toBe('Test rejection notes');
    });

    it('200 — audit_log entry: from_status=pending, to_status=rejected', async () => {
      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rejection_reason_id: firstReasonId });

      expect(res.status).toBe(200);

      const rows = await db
        .select()
        .from(credentialAuditLog)
        .where(
          and(
            eq(credentialAuditLog.user_id, memberId),
            eq(credentialAuditLog.credential_id, credentialTypeId),
            eq(credentialAuditLog.to_status, 'rejected'),
          ),
        );
      expect(rows).toHaveLength(1);
      expect(rows[0].from_status).toBe('pending');
      expect(rows[0].to_status).toBe('rejected');
    });

    it('409 — cannot reject a credential with status=active', async () => {
      const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ expiration_date: expirationDate.toISOString() });

      const res = await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rejection_reason_id: firstReasonId });

      expect(res.status).toBe(409);
    });
  });

  // ── Re-submit ─────────────────────────────────────────────────────────────

  describe('Re-submit — POST .../confirm-upload (rejected → pending)', () => {
    beforeEach(async () => {
      await createPendingUserCredential(memberId, credentialTypeId, { actorId: memberId });
      await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rejection_reason_id: firstReasonId, review_notes: 'Initial rejection' });
    });

    afterEach(async () => {
      await cleanMemberCredential(memberId, credentialTypeId);
      await db.delete(uploadTokens).where(eq(uploadTokens.user_id, memberId));
    });

    it('200 — member can confirm-upload again after rejection; status=pending in DB', async () => {
      await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });

      const res = await request(app)
        .post(`/api/credentials/${credentialTypeId}/confirm-upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ submitted_metadata: {} });

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(row.status).toBe('pending');
    });

    it('200 — audit_log has exactly 3 rows: [submit, reject, re-submit]', async () => {
      await request(app)
        .post(`/api/credentials/${credentialTypeId}/upload-url`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ ext: 'pdf' });

      const res = await request(app)
        .post(`/api/credentials/${credentialTypeId}/confirm-upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ submitted_metadata: {} });

      expect(res.status).toBe(200);

      const rows = await db
        .select()
        .from(credentialAuditLog)
        .where(
          and(
            eq(credentialAuditLog.user_id, memberId),
            eq(credentialAuditLog.credential_id, credentialTypeId),
          ),
        );
      expect(rows).toHaveLength(3);

      const sorted = rows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      expect(sorted[0].from_status).toBeNull();
      expect(sorted[0].to_status).toBe('pending');
      expect(sorted[1].from_status).toBe('pending');
      expect(sorted[1].to_status).toBe('rejected');
      expect(sorted[2].from_status).toBe('rejected');
      expect(sorted[2].to_status).toBe('pending');
    });
  });

  // ── Revoke ────────────────────────────────────────────────────────────────

  describe('Revoke — DELETE /api/teams/:teamId/users/:userId/credentials/:credentialTypeId', () => {
    beforeEach(async () => {
      await createPendingUserCredential(memberId, credentialTypeId, { actorId: memberId });
      await request(app)
        .patch(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() });
    });

    afterEach(async () => {
      await cleanMemberCredential(memberId, credentialTypeId);
    });

    it('200 — status transitions to revoked in DB', async () => {
      const res = await request(app)
        .delete(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ reason: 'Test revocation' });

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(row.status).toBe('revoked');
    });

    it('200 — audit_log entry: from_status=active, to_status=revoked', async () => {
      const res = await request(app)
        .delete(`/api/teams/${teamId}/users/${memberId}/credentials/${credentialTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ reason: 'Test revocation' });

      expect(res.status).toBe(200);

      const rows = await db
        .select()
        .from(credentialAuditLog)
        .where(
          and(
            eq(credentialAuditLog.user_id, memberId),
            eq(credentialAuditLog.credential_id, credentialTypeId),
            eq(credentialAuditLog.to_status, 'revoked'),
          ),
        );
      expect(rows).toHaveLength(1);
      expect(rows[0].from_status).toBe('active');
      expect(rows[0].to_status).toBe('revoked');
    });
  });

  // ── Expiration ────────────────────────────────────────────────────────────

  describe('Expiration — POST /api/internal/expiration-alerts', () => {
    beforeAll(() => {
      process.env.INTERNAL_SECRET = 'test-internal-secret';
    });

    afterAll(() => {
      delete process.env.INTERNAL_SECRET;
    });

    afterEach(async () => {
      await cleanMemberCredential(memberId, credentialTypeId);
    });

    it('200 — processes credentials with next_alert_at in past; status=expired; audit actor=SYSTEM_ACTOR_ID', async () => {
      const pastDate = new Date(Date.now() - 1000);
      await db.insert(userCredentials).values({
        user_id: memberId,
        credential_id: credentialTypeId,
        status: 'active',
        file_key: `test/${randomUUID()}.pdf`,
        next_alert_at: pastDate,
        expiration_date: pastDate,
      });

      const res = await request(app)
        .post('/api/internal/expiration-alerts')
        .set('x-internal-secret', 'test-internal-secret');

      expect(res.status).toBe(200);

      const [ucRow] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.user_id, memberId),
            eq(userCredentials.credential_id, credentialTypeId),
          ),
        )
        .limit(1);
      expect(ucRow.status).toBe('expired');

      const auditRows = await db
        .select()
        .from(credentialAuditLog)
        .where(
          and(
            eq(credentialAuditLog.user_id, memberId),
            eq(credentialAuditLog.credential_id, credentialTypeId),
            eq(credentialAuditLog.to_status, 'expired'),
          ),
        );
      expect(auditRows).toHaveLength(1);
      expect(auditRows[0].actor_id).toBe(SYSTEM_ACTOR_ID);
    });

    it('401 — request without X-Internal-Secret header', async () => {
      const res = await request(app).post('/api/internal/expiration-alerts');
      expect(res.status).toBe(401);
    });

    it('401 — request with wrong X-Internal-Secret', async () => {
      const res = await request(app)
        .post('/api/internal/expiration-alerts')
        .set('x-internal-secret', 'wrong-secret');
      expect(res.status).toBe(401);
    });
  });
});
