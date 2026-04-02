import { Request, Response, NextFunction } from 'express';
import { createUser, login, refresh } from '../services/auth.serv.js';
import { registerSchema, loginSchema } from '../utils/zod.js';
import { clearTokenCookies, setTokenCookies } from '../utils/token.js';
import { TokenMissingError, TokenReuseError } from '../errors/AppError.js';
import { deleteSessions } from '../services/session.serv.js';

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
    const agent = req.headers['user-agent'] ?? 'unknown';
    const ip = req.ip ?? 'unknown';
    const { access, refresh } = await login(validated, agent, ip);

    setTokenCookies(res, access, refresh);
    res.status(200).json({ message: 'Logged in successfully' });
  }
  catch (error) {
    next(error);
  }
}

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, session } = req.user!;
    await deleteSessions(id, { specificId: session });

    clearTokenCookies(res);

    res.status(200).json({
      message: 'User logged out successfully'
    });
  }
  catch (error) {
    next(error);
  }
}

export const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new TokenMissingError();

    const { newAccess, newRefresh } = await refresh(token);
    setTokenCookies(res, newAccess, newRefresh);
    res.status(200).json({ message: 'Tokens refreshed' });
  }
  catch (error) {
    if (error instanceof TokenMissingError || error instanceof TokenReuseError) {
      clearTokenCookies(res);
    }
    next(error)
  }
}