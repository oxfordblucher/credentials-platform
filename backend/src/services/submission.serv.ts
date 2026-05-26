import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userCredentials, credentialTypes, users, teamMembers, teamCredentials, teams, credentialAuditLog } from '../db/schema/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { getGetPresignedUrl } from '../utils/s3.js';

export const getTeamSubmissions = async (teamId: string, orgId: string) => {
  return db
    .select({
      userId: userCredentials.user_id,
      credentialId: userCredentials.credential_id,
      submitted: userCredentials.submitted,
      submittedMetadata: userCredentials.submitted_metadata,
      firstName: users.first,
      lastName: users.last,
      email: users.email,
      credentialTypeId: credentialTypes.id,
      credentialTypeName: credentialTypes.name,
      credentialTypeDescription: credentialTypes.description,
      metadataSchema: credentialTypes.metadata_schema,
    })
    .from(userCredentials)
    .innerJoin(users, eq(users.id, userCredentials.user_id))
    .innerJoin(credentialTypes, eq(credentialTypes.id, userCredentials.credential_id))
    .innerJoin(teamMembers, and(
      eq(teamMembers.user_id, userCredentials.user_id),
      eq(teamMembers.team_id, teamId),
    ))
    .innerJoin(teamCredentials, and(
      eq(teamCredentials.credential_id, userCredentials.credential_id),
      eq(teamCredentials.team_id, teamId),
    ))
    .innerJoin(teams, and(
      eq(teams.id, teamId),
      eq(teams.org_id, orgId),
    ))
    .where(eq(userCredentials.status, 'pending'));
};

export const getSubmissionDocumentUrl = async (
  teamId: string,
  userId: string,
  credentialTypeId: string,
  actorId: string,
  orgId: string,
): Promise<string> => {
  const [row] = await db
    .select({
      fileKey: userCredentials.file_key,
      status: userCredentials.status,
    })
    .from(userCredentials)
    .innerJoin(teamMembers, and(
      eq(teamMembers.user_id, userCredentials.user_id),
      eq(teamMembers.team_id, teamId),
    ))
    .innerJoin(teamCredentials, and(
      eq(teamCredentials.credential_id, userCredentials.credential_id),
      eq(teamCredentials.team_id, teamId),
    ))
    .innerJoin(teams, and(
      eq(teams.id, teamId),
      eq(teams.org_id, orgId),
    ))
    .where(and(
      eq(userCredentials.user_id, userId),
      eq(userCredentials.credential_id, credentialTypeId),
    ))
    .limit(1);

  if (!row || !row.fileKey) throw new NotFoundError('Credential document not found');

  const url = await getGetPresignedUrl(row.fileKey, 3600);

  await db.insert(credentialAuditLog).values({
    user_id: userId,
    credential_id: credentialTypeId,
    from_status: row.status,
    to_status: row.status,
    actor_id: actorId,
    notes: 'document_viewed',
  });

  return url;
};
