import { eq, ne, and, sql } from "drizzle-orm";
import { sessions, users, teamMembers } from "../db/schema/index.js";
import { UAParser } from 'ua-parser-js';
import { db } from "../db/index.js";
import { hashToken } from "../utils/token.js";
import { Transaction } from '../types/types.js';

const parseDeviceInfo = (agent: string) => {
  if (agent === "unknown") return "Unknown device";
  const {browser, os, device} = UAParser(agent);
  return `${device.vendor} ${device.model}, ${os.name}, ${browser.name}`;
}

export const createSession = async (tx: Transaction, id: string, user: string, token: string, agent: string, ip: string) => {
  const result = await tx.insert(sessions).values({
    id: id,
    user_id: user,
    token: hashToken(token),
    agent: agent,
    device: parseDeviceInfo(agent),
    ip: ip
  });

  return result.rowCount > 0;
}

export const fetchSessions = async (userId: string) => {
  const result = await db.select({
    device: sessions.device,
    ip: sessions.ip,
    lastUsed: sessions.last_used
  }).from(sessions).where(eq(sessions.user_id, userId));

  return result;
}

export const deleteSessions = async (userId: string, options?: { exclude?: string, specificId?: string }, tx?: Transaction) => {
  const exec = async (tx: Transaction) => {
    const conditions = [eq(sessions.user_id, userId)];

    if (options?.exclude) {
      conditions.push(ne(sessions.id, options.exclude));
    } else if (options?.specificId) {
      conditions.push(eq(sessions.id, options.specificId));
    }

    const result = await tx.delete(sessions).where(and(...conditions)).returning({
      deletedId: sessions.id
    });
    return result.length > 0;
  }

  return tx ? exec(tx) : db.transaction(exec);
}

export const fetchSessionInfo = async (userId: string, sessionId: string) => {
  const [sessionInfo] = await db.select({
    user: users.id,
    org: users.org_id,
    isAdmin: users.is_admin,
    session: sessions.id,
    token: sessions.token
  }).from(users)
  .innerJoin(sessions, eq(users.id, sessions.user_id))
  .where(and(eq(sessions.user_id, userId), eq(sessions.id, sessionId)))
  .limit(1);

  return sessionInfo;
}

export const updateSession = async (userId: string, sessionId: string, hash: string) => {
  const result = await db.update(sessions).set({
    token: hash,
    last_used: sql`NOW()`,
    expiration: sql`NOW() + INTERVAL '7d'`
  }).where(and(eq(sessions.user_id, userId), eq(sessions.id, sessionId)))

  return result.rowCount > 0;
}