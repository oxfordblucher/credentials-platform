export const Events = {
  CREDENTIAL_REQUIRED: 'credential.required',
  CREDENTIAL_SUBMITTED: 'credential.submitted',
  CREDENTIAL_VERIFIED: 'credential.verified',
  CREDENTIAL_REVOKED: 'credential.revoked',
  CREDENTIAL_EXPIRING: 'credential.expiring',
  CREDENTIAL_REJECTED: 'credential.rejected',
  INVITE_CREATED: 'invite.created',
  INVITE_ACCEPTED: 'invite.accepted',
} as const;

export type EventPayloads = {
  [Events.CREDENTIAL_REQUIRED]: { teamId: string, teamName: string, credId: string, credName: string };
  [Events.CREDENTIAL_SUBMITTED]: { userId: string, credId: string, credName: string };
  [Events.CREDENTIAL_VERIFIED]: { userId: string, credId: string, credName: string };
  [Events.CREDENTIAL_REVOKED]: { userId: string, credId: string, credName: string };
  [Events.CREDENTIAL_EXPIRING]: { userId: string, credId: string, daysUntilExpiry: number };
  [Events.CREDENTIAL_REJECTED]: { userId: string; credId: string; credName: string; rejectionReasonId: string; reviewNotes?: string };
  [Events.INVITE_CREATED]: { teamId: string; inviteeEmail: string; inviterName: string; inviteToken: string };
  [Events.INVITE_ACCEPTED]: { teamId: string, userId: string };
}