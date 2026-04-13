import { credentials, NewUserCred, teamCredentials, userCredentials } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, and, eq } from "drizzle-orm";
import { ManagedCredParams } from "../types/types.js";
import { Events } from "../events/event.js";
import { evtEmitter } from "../events/emitter.js";

export const readCredentials = async (userId: string) => {
  const result = await db.query.credentials.findMany({
    with: {
      userCredentials: {
        where: {
          user_id: userId
        },
        columns: {
          verifier_id: true,
          submitted: true,
          verified: true,
          expiration: true
        }
      }
    }
  })

  return result;
}

export const createUserCreds = async (credInput: NewUserCred) => {
  const [result] = await db.insert(userCredentials).values({
    ...credInput
  }).returning();

  if (result) {
    evtEmitter.emit(Events.CREDENTIAL_SUBMITTED);
  }

  return result ?? null;
}

export const updateVerifyCreds = async ({ mgrId, userId, credId }: ManagedCredParams) => {
  const [result] = await db.update(userCredentials).set({
    verified: sql`NOW()`,
    verifier_id: mgrId
  }).where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credId)))
    .returning({
      credId: userCredentials.credential_id,
      userId: userCredentials.user_id
    });

  if (result) {
    evtEmitter.emit(Events.CREDENTIAL_VERIFIED, result);
  }
  return result ?? null;
}

export const deleteCredentials = async ({ mgrId, userId, credId }: ManagedCredParams) => {
  const [result] = db.update(userCredentials).set({
    revocation: sql`NOW()`,
    revoker_id: mgrId,
    status: 'revoked'
  }).where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credId)))
    .returning({
      credId: userCredentials.credential_id,
      userId: userCredentials.user_id
    });
}

export const readTeamCreds = async (teamId: string) => {
  const result = await db.query.credentials.findMany({
    with: {
      teamCredentials: {
        where: {
          team_id: teamId
        }
      }
    }
  });

  return result;
}

export const createTeamCred = async (teamId: string, credId: string) => {
  await db.insert(teamCredentials).values({
    team_id: teamId,
    credential_id: credId
  });

  const [result] = await db.query.credentials.findFirst({
    where: { id: credId },
    columns: {
      id: true,
      name: true,
      description: true
    }
  });

  if (result) {
    evtEmitter.emit(Events.CREDENTIAL_CREATED, { teamId, credId });
  }

  return result ?? null;
}

export const deleteTeamCred = async (teamId: string, credId: string) => {
  const [result] = await db.delete(teamCredentials)
    .where(and(eq(teamCredentials.credential_id, credId), eq(teamCredentials.team_id, teamId)))
    .returning({ deletedId: teamCredentials.credential_id });

  return result ?? null;
}