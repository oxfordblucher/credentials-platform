import jwt from 'jsonwebtoken';
import { readFileSync } from "fs";
import crypto from 'crypto';
const jwtSecrets = JSON.parse(readFileSync(process.env.JWT_SECRET_FILE, 'utf-8'));
const accessSecret = jwtSecrets.access_secret;
const refreshSecret = jwtSecrets.refresh_secret;
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
export const genInvite = () => {
    return crypto.randomBytes(32).toString('hex');
};
export const genUUID = () => {
    return crypto.randomUUID();
};
export const signRefreshToken = (userId, sessionId) => {
    return jwt.sign({ user: userId, session: sessionId }, refreshSecret, { expiresIn: '7d' });
};
export const signAccessToken = (user) => {
    return jwt.sign({ id: user.id, orgId: user.orgId, sessionId: user.sessionId, orgRole: user.orgRole }, accessSecret, { expiresIn: '15m' });
};
export const verifyAccess = (token) => {
    return jwt.verify(token, accessSecret);
};
export const verifyRefresh = (token) => {
    return jwt.verify(token, refreshSecret);
};
export const setTokenCookie = (res, refresh) => {
    res.cookie('refreshToken', refresh, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};
export const clearTokenCookie = (res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/auth/refresh',
    });
};
