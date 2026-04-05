import { db } from '../db/index.js';

export type AccessPayload = {
  id: string;
  org: string;
  sessionId: string;
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

export type ProfileRow = {
  id: string;
  first: string;
  last: string;
  dob: Date;
  email: string;
  org: string;
  isAdmin: boolean;
  role: string | null;
  team: string | null;
}

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];