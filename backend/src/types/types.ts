export interface User {
  id: string;
  first: string;
  last: string;
  dob: Date;
  role: string;
  org: string;
  team: string;
  email: string;
  password: string;
  created: Date;
  login: Date | null;
}

export type RegisterUser = Pick<User, "first" | "last" | "dob" | "email" | "password" | "role" | "org" | "team">