import { Request, Response, NextFunction } from 'express';
import { createUser, login, refresh } from '../services/auth.serv.js';
import { registerSchema, loginSchema } from '../utils/zod.js';
import { setTokenCookies } from '../utils/token.js';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    await createUser(validated);

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
    const agent = req.headers['user-agent'];
    const ip = req.ip;
    const { access, refresh } = await login(validated);

    setTokenCookies(res, access, refresh);
    res.status(200).json({ message: 'Logged in successfully' });
  }
  catch (error) {
    next(error);
  }
}

export const logoutUser = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    message: 'User logged out successfully'
  });
}

export const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    const { newAccess, newRefresh } = await refresh(token);
    setTokenCookies(res, newAccess, newRefresh);
    res.status(200).json({ message: 'Tokens refreshed' });
  }
  catch (error) {
    next(error)
  }
}