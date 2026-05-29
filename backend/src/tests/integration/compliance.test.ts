import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  app,
  createTestOrg,
  createTestTeam,
  createTestCredentialType,
  assignCredentialToTeam,
  createTestUser,
  createPendingUserCredential,
  cleanupTestOrg,
} from './setup/testHelpers.js';

describe('Compliance dashboard', () => {
  let orgId: string;
  let ownerId: string;
  let ownerToken: string;
  let teamId: string;
  let credentialTypeId: string;
  let member1Id: string;
  let member1Token: string;
  let member2Id: string;
  let member3Id: string;
  let managerToken: string;

  beforeAll(async () => {
    ({ orgId, ownerId, ownerToken } = await createTestOrg());
    ({ teamId } = await createTestTeam(orgId, ownerId));
    ({ credentialTypeId } = await createTestCredentialType(orgId));
    await assignCredentialToTeam(teamId, credentialTypeId);

    ({ userId: member1Id, token: member1Token } = await createTestUser(orgId, 'member', teamId));
    ({ userId: member2Id } = await createTestUser(orgId, 'member', teamId));
    ({ userId: member3Id } = await createTestUser(orgId, 'member', teamId));
    ({ token: managerToken } = await createTestUser(orgId, 'manager', teamId));

    // member1 → active with expiration 90 days out
    await createPendingUserCredential(member1Id, credentialTypeId, { actorId: member1Id });
    const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await request(app)
      .patch(`/api/teams/${teamId}/users/${member1Id}/credentials/${credentialTypeId}/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ expiration_date: expirationDate });

    // member2 → pending
    await createPendingUserCredential(member2Id, credentialTypeId, { actorId: member2Id });

    // member3 → no credential (no action)
  });

  afterAll(async () => {
    await cleanupTestOrg(orgId);
  });

  describe('GET /api/teams/:teamId/compliance', () => {
    it('200 — returns matrix with 3 member rows', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}/compliance`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.matrix).toHaveLength(3);
    });

    it('200 — member1 shows status=active with expiration_date set', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}/compliance`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const member1Row = res.body.matrix.find((r: { user: { id: string } }) => r.user.id === member1Id);
      expect(member1Row).toBeDefined();
      const cred = member1Row.credentials[0];
      expect(cred.status).toBe('active');
      expect(cred.expiration_date).not.toBeNull();
    });

    it('200 — member2 shows status=pending', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}/compliance`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const member2Row = res.body.matrix.find((r: { user: { id: string } }) => r.user.id === member2Id);
      expect(member2Row).toBeDefined();
      expect(member2Row.credentials[0].status).toBe('pending');
    });

    it('200 — member3 shows no credential entry (missing/required)', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}/compliance`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const member3Row = res.body.matrix.find((r: { user: { id: string } }) => r.user.id === member3Id);
      expect(member3Row).toBeDefined();
      expect(member3Row.credentials[0].status).toBeNull();
    });

    it('200 — summary.fully_compliant = 1, summary.has_gaps >= 1', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}/compliance`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.fully_compliant).toBe(1);
      expect(res.body.summary.has_gaps).toBeGreaterThanOrEqual(1);
    });

    it('403 — member token cannot access team compliance endpoint', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}/compliance`)
        .set('Authorization', `Bearer ${member1Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/orgs/compliance', () => {
    it('200 — response contains an entry for teamId', async () => {
      const res = await request(app)
        .get('/api/orgs/compliance')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const teamEntry = res.body.teams.find((t: { team: { id: string } }) => t.team.id === teamId);
      expect(teamEntry).toBeDefined();
    });

    it('200 — compliance_rate for the team is a float between 0.0 and 1.0', async () => {
      const res = await request(app)
        .get('/api/orgs/compliance')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const teamEntry = res.body.teams.find((t: { team: { id: string } }) => t.team.id === teamId);
      expect(teamEntry).toBeDefined();
      expect(teamEntry.compliance_rate).toBeGreaterThanOrEqual(0.0);
      expect(teamEntry.compliance_rate).toBeLessThanOrEqual(1.0);
    });

    it('403 — manager cannot access org-level compliance endpoint', async () => {
      const res = await request(app)
        .get('/api/orgs/compliance')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
