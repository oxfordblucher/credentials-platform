import { invites, teams } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { NotFoundError } from "../errors/AppError.js";
import { genInvite } from "../utils/token.js";
export const createInvites = async (inviteData, senderId) => {
    const { emails, ...newInvite } = inviteData;
    const result = await db.insert(invites).values(emails.map(email => ({
        ...newInvite,
        email: email,
        inviter_id: senderId,
        token: genInvite()
    }))).returning({
        id: invites.id,
        email: invites.email,
        expiration: invites.expiration
    });
    return result;
};
export const fetchInvites = async (id, orgRole, orgId) => {
    const where = (orgRole) ? eq(invites.org_id, orgId) : eq(invites.inviter_id, id);
    const result = await db.select({
        id: invites.id,
        teamId: invites.team_id,
        teamName: teams.name,
        email: invites.email,
        expiration: invites.expiration
    }).from(invites).innerJoin(teams, eq(teams.id, invites.team_id)).where(where);
    return result;
};
export const updateInvite = async (id) => {
    const result = await db.update(invites).set({
        expiration: sql `now() + INTERVAL '7d'`
    }).where(eq(invites.id, id)).returning();
    if (!result)
        throw new NotFoundError();
    return result;
};
export const deleteInvite = async (id) => {
    const [result] = await db.delete(invites).where(eq(invites.id, id)).returning({ deletedId: invites.id });
    if (!result)
        throw new NotFoundError();
    return result;
};
