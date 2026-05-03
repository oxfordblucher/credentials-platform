export type OrgRole = 'owner' | 'admin';

export type CredStatus =
  | 'pending'
  | 'active'
  | 'rejected'
  | 'expired'
  | 'revoked';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  orgId: string;
  orgRole: OrgRole | null; // null = member/manager (team-scoped)
  sessionId: string;
}

export interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number';
  required: boolean;
}

export interface MetadataSchema {
  fields: MetadataField[];
}

export interface CredentialType {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  metadataSchema: MetadataSchema;
  isActive: boolean;
  createdAt: string;
}

export interface RejectionReason {
  id: string;
  label: string;
}

export interface UserCredential {
  id: string;
  userId: string;
  credentialTypeId: string;
  credentialType: CredentialType;
  status: CredStatus;
  objectKey: string | null;
  submittedMetadata: Record<string, unknown> | null;
  verifiedMetadata: Record<string, unknown> | null;
  expirationDate: string | null;
  rejectionReasonId: string | null;
  reviewNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface CredentialAuditEntry {
  id: string;
  credentialId: string;
  actorId: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface TeamMembership {
  role: 'manager' | 'member';
  team: { id: string; name: string };
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiListResponse<T> {
  message: string;
  data: T[];
}

export interface ApiItemResponse<T> {
  message: string;
  data: T;
}

export interface TeamMember {
  userId: string;
  teamId: string;
  role: 'manager' | 'member';
  user: Pick<AuthUser, 'id' | 'firstName' | 'lastName' | 'email'>;
  joinedAt: string;
}

export interface Invite {
  id: string;
  email: string;
  teamId: string;
  role: 'manager' | 'member';
  expiresAt: string;
  used: boolean;
}

export interface CreateInvitePayload {
  email: string;
  teamId: string;
  role: 'manager' | 'member';
}
