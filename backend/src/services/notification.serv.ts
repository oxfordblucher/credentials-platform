import { notifications, teams, teamMembers, users, userCredentials, teamCredentials, credentialTypes } from "../db/schema/index.js";
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
  await db.insert(notifications).values({
    user_id: userId,
    payload: {
      type: "CREDENTIAL_VERIFIED",
      message: `Your ${credName} credential has been verified`,
      data: { credId, credName }
    }
  });
}

export const notifyCredRevoked = async ({ userId, credId, credName }: EventPayloads[typeof Events.CREDENTIAL_REVOKED]) => {
  await db.insert(notifications).values({
    user_id: userId,
    payload: {
      type: "CREDENTIAL_REVOKED",
      message: `Your ${credName} credential has been revoked`,
      data: { credId, credName }
    }
  });
}

export const notifyCredExpiring = async ({ userId, credId, daysUntilExpiry }: EventPayloads[typeof Events.CREDENTIAL_EXPIRING]) => {
  const [[credRow], [memberRow], managerRows] = await Promise.all([
    db.select({ name: credentialTypes.name })
      .from(credentialTypes)
      .where(eq(credentialTypes.id, credId))
      .limit(1),

    db.select({ first: users.first, last: users.last })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),

    db.select({ manager_id: teams.manager_id })
      .from(teamMembers)
      .innerJoin(teams, eq(teams.id, teamMembers.team_id))
      .innerJoin(teamCredentials, and(
        eq(teamCredentials.team_id, teams.id),
        eq(teamCredentials.credential_id, credId)
      ))
      .where(eq(teamMembers.user_id, userId)),
  ]);

  if (!credRow || !memberRow) return;

  const credName = credRow.name;
  const memberName = `${memberRow.first} ${memberRow.last}`;

  const memberNotification = {
    user_id: userId,
    payload: {
      type: "CREDENTIAL_EXPIRING",
      message: `Your ${credName} expires in ${daysUntilExpiry} days`,
      data: { credId, credName, daysUntilExpiry }
    }
  };

  const managerNotifications = managerRows
    .filter(m => m.manager_id !== null)
    .map(m => ({
      user_id: m.manager_id!,
      payload: {
        type: "CREDENTIAL_EXPIRING",
        message: `${memberName}'s ${credName} expires in ${daysUntilExpiry} days`,
        data: { userId, credId, credName, daysUntilExpiry }
      }
    }));

  await db.insert(notifications).values([memberNotification, ...managerNotifications]);
}

export const notifyInvitee = async () => {

}

export const notifyInviter = async ({ teamId, userId }: EventPayloads[typeof Events.INVITE_ACCEPTED]) => {
  const [team] = await db.select({ manager_id: teams.manager_id })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team?.manager_id) return;

  await db.insert(notifications).values({
    user_id: team.manager_id,
    payload: {
      type: "INVITE_ACCEPTED",
      message: "A user has accepted your invite and joined the team",
      data: { teamId, userId }
    }
  });
}

export const fetchUserNotifications = async (userId: string) => {
  const notifications = await db.query.notifications.findMany({
    where: {
      user_id: userId
    }
  });

  return notifications;
}

export const deleteNotifications = async (userId: string, noteId?: string) => {
  const conditions = [eq(notifications.user_id, userId)];

  if (noteId) {
    conditions.push(eq(notifications.id, noteId));
  }

  const deleted = await db.delete(notifications)
    .where(and(...conditions)).returning({ deletedId: notifications.id });

  return deleted;
}

export const updateNotifications = async (userId: string, noteId?: string) => {
  const conditions = [eq(notifications.user_id, userId)];

  if (noteId) {
    conditions.push(eq(notifications.id, noteId));
  }

  const read = await db.update(notifications).set({
    read_at: sql`NOW()`
  }).where(and(...conditions)).returning({ updatedId: notifications.id });

  return read;
}