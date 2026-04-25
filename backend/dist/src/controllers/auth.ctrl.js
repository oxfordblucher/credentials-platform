import { createUser, login, refresh } from '../services/auth.serv.js';
import { registerSchema, loginSchema } from '../utils/zod.js';
import { clearTokenCookie, setTokenCookie } from '../utils/token.js';
import { AuthError } from '../errors/AppError.js';
import { deleteSessions } from '../services/session.serv.js';
export const registerUser = async (req, res, next) => {
    try {
        const validated = registerSchema.parse(req.body);
        await createUser(validated);
        res.status(201).json({
            message: 'User registered successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const loginUser = async (req, res, next) => {
    try {
        const validated = loginSchema.parse(req.body);
        const agent = req.headers['user-agent'] ?? 'unknown';
        const ip = req.ip ?? 'unknown';
        const { access, refresh } = await login(validated, agent, ip);
        setTokenCookie(res, refresh);
        res.status(200).json({
            message: 'Logged in successfully',
            token: access
        });
    }
    catch (error) {
        next(error);
    }
};
export const logoutUser = async (req, res, next) => {
    try {
        const { id, sessionId } = req.user;
        await deleteSessions(id, { specificId: sessionId });
        clearTokenCookie(res);
        res.status(200).json({
            message: 'User logged out successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const refreshTokens = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token)
            throw new AuthError();
        const { newAccess, newRefresh } = await refresh(token);
        setTokenCookie(res, newRefresh);
        res.status(200).json({
            message: 'Tokens refreshed',
            token: newAccess
        });
    }
    catch (error) {
        if (error instanceof AuthError) {
            clearTokenCookie(res);
        }
        next(error);
    }
};
