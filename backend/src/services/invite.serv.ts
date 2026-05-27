import { invites, teams, users } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { InviteInput } from "../utils/zod.js";
import { eq, sql } from "drizzle-orm";
import { NotFoundError } from "../errors/AppError.js";
import { genInvite } from "../utils/token.js";
import { OrgRole } from "../types/types.js";
import { evtEmitter } from "../events/emitter.js";
import { Events } from "../events/event.js";

export const createInvites = async (inviteData: InviteInput, senderId: string, orgId: string) => {
  const { emails, ...newInvite } = inviteData;

  const [[inviter], result] = await Promise.all([
    db.select({ first: users.first, last: users.last })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1),

    db.insert(invites).values(
      emails.map(email => ({
        ...newInvite,
        org_id: orgId,
        email: email,
        inviter_id: senderId,
        token: genInvite()
      }))
    ).returning({
      id: invites.id,
      email: invites.email,
      token: invites.token,
      expiration: invites.expiration
    }),
  ]);

  if (inviter) {
    const inviterName = `${inviter.first} ${inviter.last}`;
    for (const invite of result) {
      evtEmitter.emit(Events.INVITE_CREATED, {
        teamId: newInvite.team_id,
        inviteeEmail: invite.email,
        inviterName,
        inviteToken: invite.token,
      });
    }
  }

  return result;
}

export const fetchInvites = async (id: string, orgRole: OrgRole, orgId: string) => {
  const where = (orgRole) ? eq(invites.org_id, orgId) : eq(invites.inviter_id, id);
  const result = await db.select({
    id: invites.id,
    teamId: invites.team_id,
    teamName: teams.name,
    email: invites.email,
    expiration: invites.expiration
  }).from(invites).innerJoin(teams, eq(teams.id, invites.team_id)).where(where);

  return result;
}

export const updateInvite = async (id: string) => {
  const result = await db.update(invites).set({
    expiration: sql`now() + INTERVAL '7d'`
  }).where(eq(invites.id, id)).returning();
  
  if (!result) throw new NotFoundError();
  return result;
}

export const deleteInvite = async (id: string) => {
  const [result] = await db.delete(invites).where(eq(invites.id, id)).returning({ deletedId: invites.id });
  
  if (!result) throw new NotFoundError();
  return result;
}