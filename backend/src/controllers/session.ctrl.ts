import { Request, Response, NextFunction } from 'express';
import { deleteSessions, fetchSessions } from '../services/session.serv.js';
import { clearTokenCookies } from '../utils/token.js';

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const sessions = await fetchSessions(id);

    res.status(200).json({
      sessions: sessions
    });
  }
  catch (error) {
    next(error);
  }
}

export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const sessionId = req.params.id!;

    await deleteSessions(id, { specificId: sessionId });

    res.status(200).json({
      message: "Session revoked successfully"
    });
  }
  catch (error) {
    next(error);
  }
}

export const revokeOtherSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, sessionId } = req.user!;
    await deleteSessions(id, { exclude: sessionId });

    res.status(200).json({
      message: "Sessions revoked successfully"
    });
  }
  catch (error) {
    next(error);
  }
}

export const revokeAllSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    await deleteSessions(id);

    clearTokenCookies(res);

    res.status(200).json({
      message: "All sessions revoked successfully"
    })
  }
  catch (error) {
    next(error);
  }
}