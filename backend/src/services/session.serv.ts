import { eq, ne, and, sql } from "drizzle-orm";
import { sessions, users, teamMembers } from "../db/schema/index.js";
import { UAParser } from 'ua-parser-js';
import { db } from "../db/index.js";
import { hashToken } from "../utils/token.js";

const parseDeviceInfo = (agent: string) => {
  const {browser, os, device} = UAParser(agent);
  return `${device.vendor} ${device.model}, ${os.name}, ${browser.name}`;
}

export const createSession = async (id: string, user: string, token: string, agent: string, ip: string) => {
  await db.insert(sessions).values({
    id: id,
    user_id: user,
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
  const conditions = [eq(sessions.user_id, userId)];

  if (options?.exclude) {
    conditions.push(ne(sessions.id, options.exclude));
  } else if (options?.specificId) {
    conditions.push(eq(sessions.id, options.specificId));
  }

  const result = await db.delete(sessions).where(and(...conditions));
  return result.rowCount ?? 0;
}

export const fetchSessionInfo = async (userId: string, sessionId: string) => {
  const [sessionInfo] = await db.select({
    user: users.id,
    role: users.role,
    org: users.org_id,
    team: teamMembers.team_id,
    session: sessions.id
  }).from(users)
  .innerJoin(sessions, eq(users.id, sessions.user_id))
  .leftJoin(teamMembers, eq(users.id, teamMembers.user_id))
  .where(and(eq(sessions.user_id, userId), eq(sessions.id, sessionId)))
  .limit(1);

  return sessionInfo;
}

export const updateSession = async (userId: string, sessionId: string, hash: string) => {
  const sessionUpdate = await db.update(sessions).set({
    token: hash,
    last_used: sql`NOW()`
  }).where(and(eq(sessions.user_id, userId), eq(sessions.id, sessionId)))

  return sessionUpdate.rowCount ?? 0;
}