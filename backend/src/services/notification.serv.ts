import { notifications, teams, teamMembers, users, userCredentials, teamCredentials } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, eq, and, notExists } from "drizzle-orm";
import { EventPayloads, Events } from "../events/event.js";

export const notifyCredReq = async ({ teamId, teamName, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_REQUIRED]) => {
  const members = await db.select({
    userId: teamMembers.user_id,
    first: users.first,
    last: users.last
  }).from(teamMembers).innerJoin(users, eq(teamMembers.user_id, users.id))
    .where(and(
      eq(teamMembers.team_id, teamId),
      eq(teamMembers.role, 'member'),
      notExists(
        db.select().from(userCredentials).where(and(
          eq(userCredentials.credential_id, credId),
          eq(teamMembers.user_id, userCredentials.user_id)
        ))
      )
    ));

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
    created_at: sql`NOW()`
  }));

  await db.insert(notifications).values(notificationsToBe);
}

export const notifyCredSubmit = async ({ userId, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_SUBMITTED]) => {
  const managers = await db.select({
    manager_id: teams.manager_id,
    first: users.first,
    last: users.last
  }).from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.team_id))
    .innerJoin(teamCredentials, and(
      eq(teamCredentials.team_id, teams.id),
      eq(teamCredentials.credential_id, credId)
    ))
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
    } : []
  });

  await db.insert(notifications).values(notificationsToBe);
}

export const notifyCredVerified = async ({ userId, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_VERIFIED]) => {

}

export const notifyCredRevoked = async ({ userId, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_REVOKED]) => {

}

export const notifyInvitee = async () => {

}

export const notifyInviter = async () => {

}