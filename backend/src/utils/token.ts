import jwt from 'jsonwebtoken';
import { readFileSync } from "fs";
import { Response } from 'express';
import { AccessPayload, RefreshPayload } from '../types/types.js';
import crypto from 'crypto';

const jwtSecrets = JSON.parse(readFileSync(process.env.JWT_SECRET_FILE!, 'utf-8'));
const accessSecret = jwtSecrets.access_secret;
const refreshSecret = jwtSecrets.refresh_secret;

export const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const genInvite = () => {
  return crypto.randomBytes(32).toString('hex');
}

export const genUUID = () => {
  return crypto.randomUUID();
}

export const signRefreshToken = (userId: string, sessionId: string) => {
  return jwt.sign(
    { user: userId, session: sessionId },
    refreshSecret,
    { expiresIn: '7d' }
  );
}

export const signAccessToken = (user: Pick<AccessPayload, 'id' | 'org' | 'sessionId' | 'isAdmin'>) => {
  return jwt.sign(
    { id: user.id, org: user.org, sessionId: user.sessionId, isAdmin: user.isAdmin },
    accessSecret,
    { expiresIn: '15m' }
  );
}

export const verifyAccess = (token: string): AccessPayload => {
  return jwt.verify(token, accessSecret);
}

export const verifyRefresh = (token: string): RefreshPayload => {
  return jwt.verify(token, refreshSecret);
}

export const setTokenCookie = (res: Response, refresh: string) => {
  res.cookie('refreshToken', refresh, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export const clearTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict', 
    path: '/auth/refresh',
  });
}