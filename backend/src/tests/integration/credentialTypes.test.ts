import request from 'supertest';
import { db } from '../../db/index.js';
import {
  app,
  createTestOrg,
  createTestAdmin,
  createTestUser,
  createTestTeam,
  createTestCredentialType,
  assignCredentialToTeam,
  cleanupTestOrg,
} from './setup/testHelpers.js';
import { credentialTypes, teamCredentials } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

describe('Credential type management', () => {
  let orgId: string;
  let ownerId: string;
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;
  let teamId: string;

  let otherOrgId: string;
  let otherOwnerToken: string;

  beforeAll(async () => {
    ({ orgId, ownerId, ownerToken } = await createTestOrg());
    ({ token: adminToken } = await createTestAdmin(orgId));
    ({ token: memberToken } = await createTestUser(orgId, 'member'));
    ({ teamId } = await createTestTeam(orgId, ownerId));

    ({ orgId: otherOrgId, ownerToken: otherOwnerToken } = await createTestOrg());
    void otherOwnerToken;
  });

  afterAll(async () => {
    await cleanupTestOrg(orgId);
    await cleanupTestOrg(otherOrgId);
  });

  describe('POST /api/orgs/credential-types', () => {
    it('201 — admin creates type; DB row has schema_version=1, deactivated_at=null', async () => {
      const res = await request(app)
        .post('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Admin-Type-${Date.now()}`, metadata_schema: {} });

      expect(res.status).toBe(201);
      expect(res.body.credentialType).toBeDefined();

      const [row] = await db
        .select()
        .from(credentialTypes)
        .where(eq(credentialTypes.id, res.body.credentialType.id))
        .limit(1);
      expect(row).toBeDefined();
      expect(row.schema_version).toBe(1);
      expect(row.deactivated_at).toBeNull();
    });

    it('201 — owner creates type', async () => {
      const res = await request(app)
        .post('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `Owner-Type-${Date.now()}`, metadata_schema: {} });

      expect(res.status).toBe(201);
    });

    it('403 — member cannot create type', async () => {
      const res = await request(app)
        .post('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: `Member-Type-${Date.now()}`, metadata_schema: {} });

      expect(res.status).toBe(403);
    });

    it('409 — duplicate name within same org', async () => {
      const name = `Dup-Type-${Date.now()}`;
      await request(app)
        .post('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name, metadata_schema: {} });

      const res = await request(app)
        .post('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name, metadata_schema: {} });

      expect(res.status).toBe(409);
    });

    it('400 — invalid metadata_schema structure (non-object root type)', async () => {
      const res = await request(app)
        .post('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `Invalid-Schema-${Date.now()}`, metadata_schema: { type: 'string' } });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/orgs/credential-types', () => {
    let activeTypeId: string;
    let deactivatedTypeId: string;

    beforeAll(async () => {
      ({ credentialTypeId: activeTypeId } = await createTestCredentialType(orgId, {
        name: `Get-Active-${Date.now()}`,
      }));
      ({ credentialTypeId: deactivatedTypeId } = await createTestCredentialType(orgId, {
        name: `Get-Deactivated-${Date.now()}`,
      }));
      await request(app)
        .delete(`/api/orgs/credential-types/${deactivatedTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
    });

    it('200 — excludes types where deactivated_at IS NOT NULL by default', async () => {
      const res = await request(app)
        .get('/api/orgs/credential-types')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const ids = (res.body.credentialTypes as Array<{ id: string }>).map((t) => t.id);
      expect(ids).toContain(activeTypeId);
      expect(ids).not.toContain(deactivatedTypeId);
    });

    it('200 — ?includeDeactivated=true returns all types', async () => {
      const res = await request(app)
        .get('/api/orgs/credential-types?includeDeactivated=true')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const ids = (res.body.credentialTypes as Array<{ id: string }>).map((t) => t.id);
      expect(ids).toContain(deactivatedTypeId);
    });
  });

  describe('PATCH /api/orgs/credential-types/:id', () => {
    let typeId: string;

    beforeAll(async () => {
      ({ credentialTypeId: typeId } = await createTestCredentialType(orgId, {
        name: `Patch-Base-${Date.now()}`,
        metadata_schema: { type: 'object', properties: { field: { type: 'string' } } },
      }));
    });

    it('200 — name-only update does NOT increment schema_version', async () => {
      const [before] = await db
        .select({ schema_version: credentialTypes.schema_version })
        .from(credentialTypes)
        .where(eq(credentialTypes.id, typeId))
        .limit(1);

      const res = await request(app)
        .patch(`/api/orgs/credential-types/${typeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: `Patch-Renamed-${Date.now()}` });

      expect(res.status).toBe(200);
      expect(res.body.credentialType.schema_version).toBe(before.schema_version);
    });

    it('200 — changed metadata_schema increments schema_version by 1', async () => {
      const [before] = await db
        .select({ schema_version: credentialTypes.schema_version })
        .from(credentialTypes)
        .where(eq(credentialTypes.id, typeId))
        .limit(1);

      const res = await request(app)
        .patch(`/api/orgs/credential-types/${typeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          metadata_schema: {
            type: 'object',
            properties: { field: { type: 'string' }, new_field: { type: 'string' } },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.credentialType.schema_version).toBe(before.schema_version + 1);
    });

    it('200 — identical metadata_schema re-submit does NOT increment schema_version', async () => {
      const [current] = await db
        .select({ schema_version: credentialTypes.schema_version, metadata_schema: credentialTypes.metadata_schema })
        .from(credentialTypes)
        .where(eq(credentialTypes.id, typeId))
        .limit(1);

      const res = await request(app)
        .patch(`/api/orgs/credential-types/${typeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ metadata_schema: current.metadata_schema });

      expect(res.status).toBe(200);
      expect(res.body.credentialType.schema_version).toBe(current.schema_version);
    });

    it('404 — cannot update type belonging to different org', async () => {
      const { credentialTypeId: otherTypeId } = await createTestCredentialType(otherOrgId);

      const res = await request(app)
        .patch(`/api/orgs/credential-types/${otherTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Hijack Attempt' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/orgs/credential-types/:id', () => {
    it('200 — sets deactivated_at; row still physically exists', async () => {
      const { credentialTypeId } = await createTestCredentialType(orgId);

      const res = await request(app)
        .delete(`/api/orgs/credential-types/${credentialTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);

      const [row] = await db
        .select()
        .from(credentialTypes)
        .where(eq(credentialTypes.id, credentialTypeId))
        .limit(1);
      expect(row).toBeDefined();
      expect(row.deactivated_at).not.toBeNull();
    });

    it('409 — cannot deactivate type with active team_credentials reference', async () => {
      const { credentialTypeId } = await createTestCredentialType(orgId);
      await assignCredentialToTeam(teamId, credentialTypeId);

      const res = await request(app)
        .delete(`/api/orgs/credential-types/${credentialTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(409);
    });

    it('404 — cannot deactivate type belonging to different org', async () => {
      const { credentialTypeId: otherTypeId } = await createTestCredentialType(otherOrgId);

      const res = await request(app)
        .delete(`/api/orgs/credential-types/${otherTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Team credential requirements — POST/DELETE /api/teams/:teamId/requirements', () => {
    let reqTypeId: string;

    beforeAll(async () => {
      ({ credentialTypeId: reqTypeId } = await createTestCredentialType(orgId));
    });

    it('201 — manager assigns credential type to team; team_credentials row exists in DB', async () => {
      const res = await request(app)
        .post(`/api/teams/${teamId}/requirements`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ credential_type_id: reqTypeId });

      expect(res.status).toBe(201);

      const [row] = await db
        .select()
        .from(teamCredentials)
        .where(and(eq(teamCredentials.team_id, teamId), eq(teamCredentials.credential_id, reqTypeId)))
        .limit(1);
      expect(row).toBeDefined();
    });

    it('200 — manager removes requirement; team_credentials row deleted from DB', async () => {
      const res = await request(app)
        .delete(`/api/teams/${teamId}/requirements/${reqTypeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);

      const rows = await db
        .select()
        .from(teamCredentials)
        .where(and(eq(teamCredentials.team_id, teamId), eq(teamCredentials.credential_id, reqTypeId)))
        .limit(1);
      expect(rows).toHaveLength(0);
    });

    it('409 — assigning the same type twice returns conflict', async () => {
      const { credentialTypeId: dupTypeId } = await createTestCredentialType(orgId);

      await request(app)
        .post(`/api/teams/${teamId}/requirements`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ credential_type_id: dupTypeId });

      const res = await request(app)
        .post(`/api/teams/${teamId}/requirements`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ credential_type_id: dupTypeId });

      expect(res.status).toBe(409);
    });

    it('403 — member cannot assign a requirement', async () => {
      const { credentialTypeId: newTypeId } = await createTestCredentialType(orgId);

      const res = await request(app)
        .post(`/api/teams/${teamId}/requirements`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ credential_type_id: newTypeId });

      expect(res.status).toBe(403);
    });

    it('200 — GET /api/teams/:teamId/requirements returns assigned types', async () => {
      const { credentialTypeId: getTestTypeId } = await createTestCredentialType(orgId);
      await assignCredentialToTeam(teamId, getTestTypeId);

      const res = await request(app)
        .get(`/api/teams/${teamId}/requirements`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.credentials).toBeDefined();
      const assigned = (res.body.credentials as Array<{ id: string; teams: unknown[] }>).find(
        (c) => c.id === getTestTypeId,
      );
      expect(assigned).toBeDefined();
      expect(assigned!.teams.length).toBeGreaterThan(0);
    });
  });
});
