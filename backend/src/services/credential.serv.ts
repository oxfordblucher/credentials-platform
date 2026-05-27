import { credentialTypes, teamCredentials, teamMembers, userCredentials, users } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { and, eq, isNull } from "drizzle-orm";
import { Events } from "../events/event.js";
import { evtEmitter } from "../events/emitter.js";
import { NotFoundError, PermissionError } from "../errors/AppError.js";

export const readCredentials = async (userId: string, actorOrgId?: string) => {
  if (actorOrgId !== undefined) {
    const [member] = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.org_id, actorOrgId)))
      .limit(1);

    if (!member) throw new PermissionError('Target user does not belong to your organisation');
  }

  const rows = await db
    .selectDistinctOn([credentialTypes.id], {
      id: credentialTypes.id,
      name: credentialTypes.name,
      description: credentialTypes.description,
      metadata_schema: credentialTypes.metadata_schema,
      uc_status: userCredentials.status,
      uc_submitted: userCredentials.submitted,
      uc_verified: userCredentials.verified,
      uc_file_key: userCredentials.file_key,
      expiration_date: userCredentials.expiration_date,
      next_alert_at: userCredentials.next_alert_at,
    })
    .from(teamMembers)
    .innerJoin(teamCredentials, eq(teamCredentials.team_id, teamMembers.team_id))
    .innerJoin(
      credentialTypes,
      and(
        eq(credentialTypes.id, teamCredentials.credential_id),
        isNull(credentialTypes.deactivated_at),
      ),
    )
    .leftJoin(
      userCredentials,
      and(
        eq(userCredentials.user_id, userId),
        eq(userCredentials.credential_id, credentialTypes.id),
      ),
    )
    .where(eq(teamMembers.user_id, userId))
    .orderBy(credentialTypes.id);

  return rows.map(row => ({
    credential_type: {
      id: row.id,
      name: row.name,
      description: row.description,
      metadata_schema: row.metadata_schema,
    },
    userCredential: row.uc_status !== null
      ? {
          status: row.uc_status,
          submitted: row.uc_submitted,
          verified: row.uc_verified,
          file_key: row.uc_file_key,
          expiration_date: row.expiration_date,
          next_alert_at: row.next_alert_at,
        }
      : null,
    status: row.uc_status ?? 'missing',
    expiration_date: row.expiration_date,
    next_alert_at: row.next_alert_at,
  }));
}

export const readTeamCreds = async (teamId: string) => {
  const result = await db.query.credentialTypes.findMany({
    with: {
      teams: {
        where: {
          team_id: teamId
        }
      }
    }
  });

  return result;
}

export const createTeamCred = async (teamId: string, credId: string, orgId: string) => {
  const [credType] = await db.select({ id: credentialTypes.id })
    .from(credentialTypes)
    .where(and(eq(credentialTypes.id, credId), eq(credentialTypes.org_id, orgId), isNull(credentialTypes.deactivated_at)))
    .limit(1);

  if (!credType) throw new NotFoundError('Credential type not found or not active in this org');

  await db.insert(teamCredentials).values({
    team_id: teamId,
    credential_id: credId
  });

  const result = await db.query.credentialTypes.findFirst({
    where: { id: credId },
    columns: {
      id: true,
      name: true
    },
    with: {
      teams: {
        where: { team_id: teamId },
        columns: { team_id: true },
        with: {
          team: {
            columns: { name: true }
          }
        }
      }
    }
  });

  evtEmitter.emit(Events.CREDENTIAL_REQUIRED, { 
    teamId: result!.teams[0].team_id,
    teamName: result!.teams[0].team!.name,
    credId: result!.id,
    credName: result!.name
  });
  return result;
}

export const deleteTeamCred = async (teamId: string, credId: string) => {
  const [result] = await db.delete(teamCredentials)
    .where(and(eq(teamCredentials.credential_id, credId), eq(teamCredentials.team_id, teamId)))
    .returning({ deletedId: teamCredentials.credential_id });

  if (!result) throw new NotFoundError();

  return result;
}

