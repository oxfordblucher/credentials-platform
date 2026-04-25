import { credentialTypes, teamCredentials, userCredentials } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, and, eq } from "drizzle-orm";
import { Events } from "../events/event.js";
import { evtEmitter } from "../events/emitter.js";
import { NotFoundError } from "../errors/AppError.js";
export const readCredentials = async (userId) => {
    const result = await db.query.credentialTypes.findMany({
        with: {
            users: {
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
    });
    return result;
};
export const createUserCreds = async (credInput) => {
    const [result] = await db.insert(userCredentials).values({
        ...credInput
    }).returning();
    evtEmitter.emit(Events.CREDENTIAL_SUBMITTED);
    return result;
};
export const updateVerifyCreds = async ({ mgrId, userId, credId }) => {
    const [result] = await db.update(userCredentials).set({
        verified: sql `NOW()`,
        verifier_id: mgrId,
        status: 'active'
    }).where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credId)))
        .returning({
        credId: userCredentials.credential_id,
        userId: userCredentials.user_id
    });
    if (!result)
        throw new NotFoundError(`Credential ${credId} for user ${userId} not found.`);
    evtEmitter.emit(Events.CREDENTIAL_VERIFIED, result);
    return result;
};
export const deleteCredentials = async ({ mgrId, userId, credId }) => {
    const [result] = await db.update(userCredentials).set({
        revocation: sql `NOW()`,
        revoker_id: mgrId,
        status: 'revoked'
    }).where(and(eq(userCredentials.user_id, userId), eq(userCredentials.credential_id, credId)))
        .returning({
        credId: userCredentials.credential_id,
        userId: userCredentials.user_id
    });
    if (!result)
        throw new NotFoundError(`Credential ${credId} for user ${userId} not found.`);
    evtEmitter.emit(Events.CREDENTIAL_REVOKED, result);
    return result;
};
export const readTeamCreds = async (teamId) => {
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
};
export const createTeamCred = async (teamId, credId) => {
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
        teamId: result.teams[0].team_id,
        teamName: result.teams[0].team.name,
        credId: result.id,
        credName: result.name
    });
    return result;
};
export const deleteTeamCred = async (teamId, credId) => {
    const [result] = await db.delete(teamCredentials)
        .where(and(eq(teamCredentials.credential_id, credId), eq(teamCredentials.team_id, teamId)))
        .returning({ deletedId: teamCredentials.credential_id });
    if (!result)
        throw new NotFoundError();
    return result;
};
export const createCredential = async (orgId, cred) => {
    const [result] = await db.insert(credentialTypes).values({
        org_id: orgId,
        name: cred.name,
        description: cred.description
    }).returning();
    return result;
};
