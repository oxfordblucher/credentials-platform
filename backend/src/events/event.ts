export const Events = {
  CREDENTIAL_REQUIRED: 'credential.required',
  CREDENTIAL_SUBMITTED: 'credential.submitted',
  CREDENTIAL_VERIFIED: 'credential.verified',
  CREDENTIAL_REVOKED: 'credential.revoked',
  INVITE_CREATED: 'invite.created',
  INVITE_ACCEPTED: 'invite.accepted',
} as const;

export type EventPayloads = {
  [Events.CREDENTIAL_REQUIRED]: { teamId: string, teamName: string, credId: string, credName: string };
  [Events.CREDENTIAL_SUBMITTED]: { userId: string, credId: string, credName: string };
  [Events.CREDENTIAL_VERIFIED]: { userId: string, credId: string, credName: string };
  [Events.CREDENTIAL_REVOKED]: { userId: string, credId: string, credName: string };
  [Events.INVITE_CREATED]: { teamId: string, userId: string };
  [Events.INVITE_ACCEPTED]: { teamId: string, userId: string };
}