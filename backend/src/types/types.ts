export interface User {
  id: string;
  first: string;
  last: string;
  dob: Date;
  role: string;
  org: string;
  team: string | null;
  email: string;
  password: string;
  created: Date;
  login: Date | null;
}

export type AccessPayload = Pick<User, 'id' | 'role' | 'org' | 'team'> & {
  iat: number;
  exp: number;
}

export interface RefreshPayload {
  user: string;
  session: string;
  iat: number;
  exp: number;
}