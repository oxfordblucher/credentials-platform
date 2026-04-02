import { db } from '../db/index.js';

export interface User {
  id: string;
  first: string;
  last: string;
  dob: Date;
  role: 'admin' | 'manager' | 'member';
  org: string;
  team: string | null;
  email: string;
  password: string;
  created: Date;
  login: Date | null;
}

export type AccessPayload = Pick<User, 'id' | 'role' | 'org' | 'team'> & {
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

export type ProfileRow = Pick<User, 'id' | 'first' | 'last' | 'dob' | 'email' | 'org'> & {
  isAdmin: boolean;
  role: string | null;
  team: string | null;
}

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];