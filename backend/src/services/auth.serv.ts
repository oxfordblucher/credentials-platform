import { eq, sql } from 'drizzle-orm';
import { teamMembers, users } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { RegisterInput, LoginInput } from '../utils/zod.js';
import { createSession, deleteSessions, fetchSessionInfo, updateSession } from './session.serv.js'
import { verifyRefresh, signRefreshToken, signAccessToken, genUUID, hashToken } from '../utils/token.js';
import { encryptPW, verifyPW } from '../utils/encrypt.js';
import { AppError, AuthError, PermissionError, NotFoundError } from '../errors/AppError.js';
import { Transaction } from '../types/types.js';

export const createUser = async (userData: RegisterInput, tx?: Transaction) => {
  // Hash the password
  const { team, role, password, ...rest } = userData;
  const hashedPassword = await encryptPW(password);
  const newUser = async (tx: Transaction) => {
    const [user] = await tx.insert(users).values({
      ...rest,
      password: hashedPassword
    }).returning({
      id: users.id
    });

    if (!user) throw new AppError(404, "User creation failed");

    if (team && role) {
      await tx.insert(teamMembers).values({
        user_id: user.id,
        team_id: team,
        role: role
      });
    }

    return user;
  }

  return tx ? newUser(tx) : db.transaction(newUser);
}

export const fetchAuthUser = async (email: string) => {
  const [fetched] = await db.select({
    id: users.id,
    hash: users.password,
    org: users.org_id,
    isAdmin: users.is_admin
  }).from(users).where(eq(users.email, email)).limit(1);

  return fetched ?? null;
}

export const login = async (credentials: LoginInput, agent: string, ip: string) => {
  const user = await fetchAuthUser(credentials.email);
  if (!user) throw new AuthError(`User with email ${credentials.email} not found`);

  const passwordMatch = await verifyPW(credentials.password, user.hash);
  if (!passwordMatch) throw new AuthError(`Login for user ${user.id} failed - wrong password`);

  const sessionId = genUUID();
  const refresh = signRefreshToken(user.id, sessionId);

  await db.transaction(async (tx: Transaction) => {
    await createSession(tx, sessionId, user.id, refresh, agent, ip);
    await tx.update(users).set({ login: sql`NOW()` }).where(eq(users.id, user.id));
  });

  const access = signAccessToken({
    id: user.id,
    org: user.org,
    sessionId: sessionId,
    isAdmin: user.isAdmin
  });

  return { access, refresh };
}

export const refresh = async (token: string): Promise<{ newAccess: string; newRefresh: string; }> => {
  const decoded = verifyRefresh(token);
  const confirmed = await fetchSessionInfo(decoded.user, decoded.sessionId);
  const hash = hashToken(token);
  if (hash !== confirmed.token) {
    await deleteSessions(decoded.user, { specificId: decoded.sessionId });
    throw new AuthError(`Token reuse detected for user ${decoded.user}`);
  }

  const newRefresh = signRefreshToken(confirmed.user, confirmed.session);
  const newAccess = signAccessToken({
    id: confirmed.user,
    org: confirmed.org,
    sessionId: confirmed.session,
    isAdmin: confirmed.isAdmin
  });
  await updateSession(confirmed.user, confirmed.session, hashToken(newRefresh));

  return { newAccess, newRefresh };
}