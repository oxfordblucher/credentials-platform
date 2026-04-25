import { notifications, teams, teamMembers, users, userCredentials, teamCredentials } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, eq, and, notExists } from "drizzle-orm";
export const notifyCredReq = async ({ teamId, teamName, credId, credName }) => {
    const members = await db.select({
        userId: teamMembers.user_id,
        first: users.first,
        last: users.last
    }).from(teamMembers).innerJoin(users, eq(teamMembers.user_id, users.id))
        .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.role, 'member'), notExists(db.select().from(userCredentials).where(and(eq(userCredentials.credential_id, credId), eq(teamMembers.user_id, userCredentials.user_id))))));
    const notificationsToBe = members.map(m => ({
        user_id: m.userId,
        payload: {
            type: "CREDENTIAL_REQUIRED",
            message: `${credName} is now required for ${teamName}`,
            data: {
                teamId: teamId,
                teamName: teamName,
                credId: credId,
                credName: credName
            }
        },
        created_at: sql `NOW()`
    }));
    await db.insert(notifications).values(notificationsToBe);
};
export const notifyCredSubmit = async ({ userId, credId, credName }) => {
    const managers = await db.select({
        manager_id: teams.manager_id,
        first: users.first,
        last: users.last
    }).from(teamMembers)
        .innerJoin(teams, eq(teams.id, teamMembers.team_id))
        .innerJoin(teamCredentials, and(eq(teamCredentials.team_id, teams.id), eq(teamCredentials.credential_id, credId)))
        .innerJoin(users, eq(users.id, teamMembers.user_id))
        .where(eq(teamMembers.user_id, userId));
    const notificationsToBe = managers.flatMap(m => {
        return m.manager_id ? {
            user_id: m.manager_id,
            payload: {
                type: "CREDENTIAL_SUBMITTED",
                message: `${m.first} ${m.last} has submitted ${credName} for approval`,
                data: {
                    credId: credId,
                    credName: credName,
                    userId: userId
                }
            }
        } : [];
    });
    await db.insert(notifications).values(notificationsToBe);
};
export const notifyCredVerified = async ({ userId, credId, credName }) => {
};
export const notifyCredRevoked = async ({ userId, credId, credName }) => {
};
export const notifyInvitee = async () => {
};
export const notifyInviter = async () => {
};
export const fetchUserNotifications = async (userId) => {
    const notifications = await db.query.notifications.findMany({
        where: {
            user_id: userId
        }
    });
    return notifications;
};
export const deleteNotifications = async (userId, noteId) => {
    const conditions = [eq(notifications.user_id, userId)];
    if (noteId) {
        conditions.push(eq(notifications.id, noteId));
    }
    const deleted = await db.delete(notifications)
        .where(and(...conditions)).returning({ deletedId: notifications.id });
    return deleted;
};
export const updateNotifications = async (userId, noteId) => {
    const conditions = [eq(notifications.user_id, userId)];
    if (noteId) {
        conditions.push(eq(notifications.id, noteId));
    }
    const read = await db.update(notifications).set({
        read_at: sql `NOW()`
    }).where(and(...conditions)).returning({ updatedId: notifications.id });
    return read;
};
