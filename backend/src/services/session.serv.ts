import { drizzle } from "drizzle-orm/node-postgres";
import { eq, ne, and, sql } from "drizzle-orm";
import { sessions, users } from "../db/schema/index.js";
import { UAParser } from 'ua-parser-js';
import { db } from "../db/index.js";
import { genUUID, hashToken } from "../utils/token.js";

const parseDeviceInfo = (agent: string) => {
  const {browser, os, device} = UAParser(agent);
  return `${device.name}, ${os.name}, ${browser.name}`;
}

export const createSession = async (id: string, user: string, token: string, agent: string, ip: string) => {
  const sessionId = genUUID();

  await db.insert(sessions).values({
    id: sessionId,
    user_id: id,
    token: hashToken(token),
    agent: agent,
    device: parseDeviceInfo(agent),
    ip: ip
  });
}

export const fetchSessions = async (userId: string) => {
  const activeSessions = await db.select({
    device: sessions.device,
    ip: sessions.ip,
    lastUsed: sessions.last_used
  }).from(sessions).where(eq(sessions.user_id, userId));

  return activeSessions;
}

export const deleteSessions = async (userId: string, options?: { exclude?: string, specificId?: string}): Promise<number> => {
  let query = db.delete(sessions).where(eq(sessions.user_id, userId));

  if (options?.exclude) {
    query = query.where(ne(sessions.id, options.exclude));
  } else if (options?.specificId) {
    query = query.where(eq(sessions.id, options.specificId));
  }

  const result = await query;
  return result.rowCount ?? 0;
}

export const fetchSessionInfo = async (userId: string, sessionId: string) => {
  const sessionInfo = await db.select({
    user: users.id,
    role: users.role,
    org: users.org,
    team: users.team,
    session: sessions.id
  }).from(sessions).leftJoin(users, eq(users.id, sessions.user_id).limit(1));
}

export const updateSession = async (userId: string, sessionId: string, hash: string) => {
  const sessionUpdate = await db.update(sessions).set({
    token: hash,
    last_used: sql`NOW()`
  }).where(and(eq(sessions.user_id, userId))).where(eq(sessions.id, sessionId))
  return sessionUpdate.rowCount ?? 0;
}