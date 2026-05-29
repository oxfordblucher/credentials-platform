import { db } from '../db/index.js';

export type OrgRole = 'admin' | 'owner' | null;

export type CreateUserInput = {
  first: string;
  last: string;
  dob: Date;
  email: string;
  password: string;
  org_id: string;
  org_role?: 'admin' | 'owner' | null;
  team?: string | null;
  role?: 'manager' | 'member' | null;
};

export type AccessPayload = {
  id: string;
  orgId: string;
  sessionId: string;
  orgRole: OrgRole;
  iat: number;
  exp: number;
}

export interface RefreshPayload {
  user: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface SessionInfo {
  user: string;
  role: 'admin' | 'manager' | 'member';
  org: string;
  team: string | null;
  sessionId: string;
}

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ManagedCredParams = {
  mgrId: string;
  userId: string;
  credId: string;
}

export type ManagedTeamParams = {
  mgrId: string;
  userId: string;
  teamId: string;
}

export type ManagedInviteParams = {
  senderId: string;
  inviteId: string;
}