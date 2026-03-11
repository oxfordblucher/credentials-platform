export interface UserInput {
  first: string;
  last: string;
  dob: string;
  email: string;
  password: string;
}

export interface DBUser extends UserInput {
  id: string;
  created: Date;
  login: Date | null;
}