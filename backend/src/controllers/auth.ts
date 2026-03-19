import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from "zod";
import fs from "fs";
import { users } from '../db/users.js';
import { createUser, fetchUser, verifyPW } from '../services/user.js';
import { createSession } from '../services/session.js'
import { AppError } from '../errors/AppError.js';

const registerSchema = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.preprocess((val: unknown) => new Date(val as string), z.date()),
  email: z.email(),
  password: z.string().min(8),
  role: z.string().regex(/^(admin|manager|team member)$/)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  device: z.string()
});

const jwtSecret = fs.readFileSync(process.env.JWT_SECRET_FILE!, 'utf-8').trim();

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

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await fetchUser(validated.email);
    if (!user) throw new AppError(404, 'User not found');

    const passwordMatch = await verifyPW(validated.password, user.password);
    if (!passwordMatch) throw new AppError(401, 'Invalid credentials');

    const refresh = jwt.sign(
      { id: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    createSession(user.id, refresh, validated.device);

    const access = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );

    res.status(200).json({ access });
  }
  catch (error) {
    next(error);
  }
}

export const logoutUser = (req: Request, res: Response) => {
  res.status(200).json({
    message: 'User logged out successfully'
  });
}