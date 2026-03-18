import { Request, Response, NextFunction } from 'express';
import { users } from '../db/users.js';
import { createUser, fetchUser, verifyPW } from '../services/user.js';
import { AppError } from '../errors/AppError.js';
import jwt from 'jsonwebtoken';
import { z } from "zod";

const registerSchema = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.preprocess((val) => new Date(val as string), z.date()),
  email: z.email(),
  password: z.string().min(8),
  role: z.string().regex(/^(admin|manager|team member)$/)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);

    const created = await createUser(validated);

    res.status(201).json({
      message: 'User registered successfully'
    })
  }
  catch (error) {
    next(error);
  }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await fetchUser(validated.email);

    if (!user) throw new AppError(404, 'User not found');

    const passwordMatch = await verifyPW(validated.password, user.password);

    if (!passwordMatch) throw new AppError(401, 'Invalid credentials');

    res.status(200).json({
      message: 'User logged in successfully'
    });
  }
  catch (error) {

  }
}

export const logoutUser = (req: Request, res: Response) => {
  res.status(200).json({
    message: 'User logged out successfully'
  });
}