import request from 'supertest';
import {
  app,
  createTestOrg,
  createTestUser,
  createTestTeam,
  createTestCredentialType,
  assignCredentialToTeam,
  cleanupTestOrg,
} from './setup/testHelpers.js';

describe('Permission enforcement', () => {
  let orgAId: string;
  let ownerAId: string;
  let ownerAToken: string;
  let teamAId: string;
  let typeAId: string;
  let memberId: string;
  let memberToken: string;
  let managerToken: string;

  let orgBId: string;
  let ownerBId: string;
  let ownerBToken: string;
  let typeBId: string;
  let teamBId: string;

  beforeAll(async () => {
    // Org A
    ({ orgId: orgAId, ownerId: ownerAId, ownerToken: ownerAToken } = await createTestOrg());
    ({ teamId: teamAId } = await createTestTeam(orgAId, ownerAId));
    ({ credentialTypeId: typeAId } = await createTestCredentialType(orgAId));
    await assignCredentialToTeam(teamAId, typeAId);
    ({ userId: memberId, token: memberToken } = await createTestUser(orgAId, 'member', teamAId));
    ({ token: managerToken } = await createTestUser(orgAId, 'manager', teamAId));

    // Org B (cross-org isolation)
    ({ orgId: orgBId, ownerId: ownerBId, ownerToken: ownerBToken } = await createTestOrg());
    ({ credentialTypeId: typeBId } = await createTestCredentialType(orgBId));
    ({ teamId: teamBId } = await createTestTeam(orgBId, ownerBId));
  });

  afterAll(async () => {
    await cleanupTestOrg(orgAId);
    await cleanupTestOrg(orgBId);
  });

  describe('Member cannot access manager routes', () => {
    it('403 — GET /api/teams/:teamAId/submissions as member', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamAId}/submissions`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it('403 — PATCH .../verify as member', async () => {
      const res = await request(app)
        .patch(`/api/teams/${teamAId}/users/${memberId}/credentials/${typeAId}/verify`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() });

      expect(res.status).toBe(403);
    });

    it('403 — PATCH .../reject as member', async () => {
      const res = await request(app)
        .patch(`/api/teams/${teamAId}/users/${memberId}/credentials/${typeAId}/reject`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ rejection_reason_id: '00000000-0000-0000-0000-000000000001' });

      expect(res.status).toBe(403);
    });

    it('403 — DELETE .../credentials/:typeId as member (revoke)', async () => {
      const res = await request(app)
        .delete(`/api/teams/${teamAId}/users/${memberId}/credentials/${typeAId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Manager cannot access admin/owner routes', () => {
    it('403 — POST /api/orgs/credential-types as manager', async () => {
      const res = await request(app)
        .post('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: `Manager-Type-${Date.now()}`, metadata_schema: {} });

      expect(res.status).toBe(403);
    });

    it('403 — PATCH /api/orgs/credential-types/:id as manager', async () => {
      const res = await request(app)
        .patch(`/api/orgs/credential-types/${typeAId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: `Manager-Rename-${Date.now()}` });

      expect(res.status).toBe(403);
    });

    it('403 — DELETE /api/orgs/credential-types/:id as manager', async () => {
      const res = await request(app)
        .delete(`/api/orgs/credential-types/${typeAId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Cross-org tenancy isolation', () => {
    it('org A owner GET credential-types does not include typeBId', async () => {
      const res = await request(app)
        .get('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${ownerAToken}`);

      expect(res.status).toBe(200);
      const ids = (res.body.credentialTypes as Array<{ id: string }>).map((t) => t.id);
      expect(ids).not.toContain(typeBId);
    });

    it('404 — org A owner cannot PATCH org B credential type', async () => {
      const res = await request(app)
        .patch(`/api/orgs/credential-types/${typeBId}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ name: 'Cross-Org Hijack' });

      expect(res.status).toBe(404);
    });

    it('404 — org A owner cannot DELETE (deactivate) org B credential type', async () => {
      const res = await request(app)
        .delete(`/api/orgs/credential-types/${typeBId}`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      expect(res.status).toBe(404);
    });

    it('403 — org A manager cannot view org B team submissions', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamBId}/submissions`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
