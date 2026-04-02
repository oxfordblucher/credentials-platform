import { eq, sql } from 'drizzle-orm';
import { teamMembers, users } from "../db/schema/index.js";
import { db } from "../db/index.js";
import bcrypt from 'bcrypt';
import { RegisterInput, LoginInput } from '../utils/zod.js';
import { createSession, deleteSessions, fetchSessionInfo, updateSession } from './session.serv.js'
import { verifyRefresh, signRefreshToken, signAccessToken, genUUID, hashToken } from '../utils/token.js';
import { AppError, TokenReuseError } from '../errors/AppError.js';
import { Transaction } from '../types/types.js';

export const createUser = async (userData: RegisterInput) => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const result = await db.insert(users).values({
    ...userData,
    password: hashedPassword
  }).returning({
    id: users.id,
    email: users.email
  });

  if (!result.rowCount) throw new AppError(404, "Account creation failed");
}

export const fetchAuthUser = async (email: string) => {
  const [fetched] = await db.select({
    id: users.id,
    hash: users.password,
    role: users.role,
    org: users.org_id,
    team: teamMembers.team_id
  }).from(users).leftJoin(teamMembers, eq(users.id, teamMembers.user_id)).where(eq(users.email, email)).limit(1);

  return fetched ?? null;
}

export const verifyPW = async (input: string, hashed: string) => {
  return bcrypt.compare(input, hashed);
}

export const login = async (credentials: LoginInput, agent: string, ip: string) => {
  const user = await fetchAuthUser(credentials.email);
  if (!user) throw new AppError(404, 'User not found');

  const passwordMatch = await verifyPW(credentials.password, user.hash);
  if (!passwordMatch) throw new AppError(401, 'Invalid credentials');

  const sessionId = genUUID();
  const refresh = signRefreshToken(user.id, sessionId);

  await db.transaction(async (tx: Transaction) => {
    await createSession(tx, sessionId, user.id, refresh, agent, ip);
    await tx.update(users).set({ login: sql`NOW()` }).where(eq(users.id, user.id));
  });

  const access = signAccessToken({
    id: user.id,
    role: user.role,
    org: user.org,
    team: user.team,
    session: sessionId
  });

  return { access, refresh };
}

export const refresh = async (token: string): Promise<{ newAccess: string; newRefresh: string; }> => {
  const decoded = verifyRefresh(token);
  const confirmed = await fetchSessionInfo(decoded.user, decoded.sessionId);
  const hash = hashToken(token);
  if (hash !== confirmed.token) {
    await deleteSessions(decoded.user, { specificId: decoded.sessionId });
    throw new TokenReuseError();
  }

  const newRefresh = signRefreshToken(confirmed.user, confirmed.session);
  const newAccess = signAccessToken({
    id: confirmed.user,
    role: confirmed.role,
    org: confirmed.org,
    team: confirmed.team,
    session: confirmed.session
  });
  await updateSession(confirmed.user, confirmed.session, hashToken(newRefresh));

  return { newAccess, newRefresh };
}