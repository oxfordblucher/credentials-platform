import { z } from "zod";

export const registerSchema = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.preprocess((val: unknown) => new Date(val as string), z.date()),
  email: z.email(),
  password: z.string().min(8),
  role: z.string().regex(/^(admin|manager|team member)$/)
});

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export type LoginInput = z.infer<typeof loginSchema>