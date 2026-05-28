import request from 'supertest';
import { db } from '../../db/index.js';
import { app, createTestOrg, cleanupTestOrg } from './setup/testHelpers.js';
import { users, sessions } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

describe('Auth flows', () => {
  let orgId: string;
  let ownerId: string;
  let ownerEmail: string;
  const testStart = new Date();

  const extractRefreshToken = (res: request.Response): string | undefined => {
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    const cookie = cookies?.find(c => c.toLowerCase().startsWith('refreshtoken='));
    return cookie?.split(';')[0].split('=').slice(1).join('=');
  };

  beforeAll(async () => {
    ({ orgId, ownerId } = await createTestOrg());
    ownerEmail = `owner-${ownerId.slice(0, 8)}@test.example`;
  });

  afterAll(async () => {
    await cleanupTestOrg(orgId);
  });

  describe('POST /api/auth/register', () => {
    it('201 — creates user row; password column is not plaintext', async () => {
      const email = `reg-${Date.now()}@test.example`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ first: 'New', last: 'User', dob: '2000-01-01', email, password: 'password123', org_id: orgId });

      expect(res.status).toBe(201);

      const [row] = await db.select({ password: users.password }).from(users).where(eq(users.email, email)).limit(1);
      expect(row).toBeDefined();
      expect(row.password).not.toBe('password123');
      expect(row.password.startsWith('$2b$')).toBe(true);
    });

    it('409 — conflict when email already exists', async () => {
      const email = `dup-${Date.now()}@test.example`;
      const body = { first: 'A', last: 'B', dob: '2000-01-01', email, password: 'password123', org_id: orgId };
      await request(app).post('/api/auth/register').send(body);
      const res = await request(app).post('/api/auth/register').send(body);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('200 — returns access token and sets HttpOnly refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ownerEmail, password: 'testpassword' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();

      const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
      const refreshCookie = cookies?.find(c => c.toLowerCase().startsWith('refreshtoken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toMatch(/HttpOnly/i);
    });

    it('200 — updates last_login timestamp on users row', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ownerEmail, password: 'testpassword' });

      expect(res.status).toBe(200);

      const [row] = await db.select({ login: users.login }).from(users).where(eq(users.id, ownerId)).limit(1);
      expect(row.login).not.toBeNull();
      expect(row.login!.getTime()).toBeGreaterThanOrEqual(testStart.getTime());
    });

    it('401 — wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ownerEmail, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('401 — non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.example', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ownerEmail, password: 'testpassword' });
      const token = extractRefreshToken(res);
      if (!token) throw new Error('No refresh cookie in login response');
      refreshToken = token;
    });

    it('200 — returns new access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('200 — sets a new refresh cookie (value differs from the one used in request)', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(res.status).toBe(200);
      const newToken = extractRefreshToken(res);
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(refreshToken);
    });

    it('401 — refresh cookie absent', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('401 — token reuse detection', async () => {
      // Consume refreshToken — session now holds a new token hash
      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      // Reusing the original token triggers reuse detection → 401
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/logout', () => {
    it('200 — deletes session row from DB', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: ownerEmail, password: 'testpassword' });

      const accessToken: string = loginRes.body.token;
      const payload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString(),
      ) as { sessionId: string };

      const logoutRes = await request(app)
        .delete('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutRes.status).toBe(200);

      const sessionRows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, payload.sessionId))
        .limit(1);
      expect(sessionRows).toHaveLength(0);
    });
  });
});
