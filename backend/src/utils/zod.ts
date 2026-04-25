import { z } from "zod";

export const setupSchema = z.object({
  orgName: z.string(),
  orgAddress: z.string(),
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.preprocess((val: unknown) => new Date(val as string), z.date()),
  email: z.email(),
  password: z.string().min(8)
});

export type SetupInput = z.infer<typeof setupSchema>

export const registerSchema = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.coerce.date().refine((date) => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 16);
    return date <= maxDate;
  }, {
    message: "Birth date must be in the past"
  }),
  email: z.email(),
  password: z.string().min(8),
  org_id: z.string(),
  team: z.string().nullish(),
  role: z.enum(["manager", "member"]).nullish(),
  org_role: z.enum(['admin', 'owner']).nullish()
});

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export type LoginInput = z.infer<typeof loginSchema>

export const inviteSchema = z.object({
  emails: z.array(z.email()).min(1),
  org_id: z.string(),
  team_id: z.string(),
  role: z.enum(["manager", "member"])
});

export type InviteInput = z.infer<typeof inviteSchema>

export const newCredSchema = z.object({
  name: z.string(),
  description: z.string()
});

export type newCredInput = z.infer<typeof newCredSchema>

export const userCredSchema = z.object({
  credential_id: z.string(),
  file: z.string()
});

export const newTeamSchema = z.object({
  name: z.string(),
  description: z.string() 
});