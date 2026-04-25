import { eq, ne, and, sql } from "drizzle-orm";
import { sessions, users } from "../db/schema/index.js";
import { UAParser } from 'ua-parser-js';
import { db } from "../db/index.js";
import { hashToken } from "../utils/token.js";
const parseDeviceInfo = (agent) => {
    if (agent === "unknown")
        return "Unknown device";
    const { browser, os, device } = UAParser(agent);
    return `${device.vendor} ${device.model}, ${os.name}, ${browser.name}`;
};
export const createSession = async (tx, id, user, token, agent, ip) => {
    await tx.insert(sessions).values({
        id: id,
        user_id: user,
        token: hashToken(token),
        agent: agent,
        device: parseDeviceInfo(agent),
        ip: ip
    });
};
export const fetchSessions = async (userId) => {
    const result = await db.select({
        device: sessions.device,
        ip: sessions.ip,
        lastUsed: sessions.last_used
    }).from(sessions).where(eq(sessions.user_id, userId));
    return result;
};
export const deleteSessions = async (userId, options, tx) => {
    const exec = async (tx) => {
        const conditions = [eq(sessions.user_id, userId)];
        if (options?.exclude) {
            conditions.push(ne(sessions.id, options.exclude));
        }
        else if (options?.specificId) {
            conditions.push(eq(sessions.id, options.specificId));
        }
        const result = await tx.delete(sessions).where(and(...conditions)).returning({
            deletedId: sessions.id
        });
        return result.length > 0;
    };
    return tx ? exec(tx) : db.transaction(exec);
};
export const fetchSessionInfo = async (userId, sessionId) => {
    const [sessionInfo] = await db.select({
        user: users.id,
        org: users.org_id,
        orgRole: users.org_role,
        session: sessions.id,
        token: sessions.token
    }).from(users)
        .innerJoin(sessions, eq(users.id, sessions.user_id))
        .where(and(eq(sessions.user_id, userId), eq(sessions.id, sessionId)))
        .limit(1);
    return sessionInfo;
};
export const updateSession = async (userId, sessionId, hash) => {
    await db.update(sessions).set({
        token: hash,
        last_used: sql `NOW()`,
        expiration: sql `NOW() + INTERVAL '7d'`
    }).where(and(eq(sessions.user_id, userId), eq(sessions.id, sessionId)));
};
