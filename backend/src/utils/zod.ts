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
  dob: z.preprocess((val: unknown) => new Date(val as string), z.date()),
  email: z.email(),
  password: z.string().min(8),
  org: z.string(),
  team: z.string().nullable(),
  role: z.string().nullable()
});

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export type LoginInput = z.infer<typeof loginSchema>

export const inviteSchema = z.object({
  email: z.array(z.email()).min(1),
  org: z.string(),
  team: z.string(),
  role: z.string().regex(/^(manager|member)$/)
});

export type InviteInput = z.infer<typeof inviteSchema>

export const newCredSchema = z.object({
  name: z.string(),
  description: z.string()
});

export const userCredSchema = z.object({
  credential_id: z.string(),
  file: z.string()
});