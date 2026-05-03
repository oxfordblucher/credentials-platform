import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { subYears, isAfter } from 'date-fns';

// Exact schemas to be used in the route files
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().refine((val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    return !isAfter(date, subYears(new Date(), 16));
  }, 'You must be at least 16 years old'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid data for a 18-year-old', () => {
    const dob = subYears(new Date(), 18).toISOString().split('T')[0];
    expect(registerSchema.safeParse({
      firstName: 'Jane', lastName: 'Doe', dob,
      email: 'jane@example.com', password: 'password123', confirmPassword: 'password123',
    }).success).toBe(true);
  });

  it('rejects dob making user under 16', () => {
    const dob = subYears(new Date(), 15).toISOString().split('T')[0];
    expect(registerSchema.safeParse({
      firstName: 'Young', lastName: 'User', dob,
      email: 'young@example.com', password: 'password123', confirmPassword: 'password123',
    }).success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const dob = subYears(new Date(), 20).toISOString().split('T')[0];
    expect(registerSchema.safeParse({
      firstName: 'A', lastName: 'B', dob,
      email: 'a@b.com', password: 'short', confirmPassword: 'short',
    }).success).toBe(false);
  });

  it('rejects mismatched confirmPassword', () => {
    const dob = subYears(new Date(), 20).toISOString().split('T')[0];
    expect(registerSchema.safeParse({
      firstName: 'A', lastName: 'B', dob,
      email: 'a@b.com', password: 'password123', confirmPassword: 'different',
    }).success).toBe(false);
  });
});
