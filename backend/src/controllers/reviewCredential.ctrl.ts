import { Request, Response, NextFunction } from 'express';
import { verifyBodySchema, rejectBodySchema, revokeBodySchema } from '../utils/zod.js';
import { verifyCredential, rejectCredential, revokeCredential } from '../services/reviewCredential.serv.js';

export const verifyCredentialCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: actorId } = req.user!;
    const { teamId, userId, credentialTypeId } = req.params as { teamId: string; userId: string; credentialTypeId: string };
    const { expiration_date, verified_metadata } = verifyBodySchema.parse(req.body);

    const credential = await verifyCredential({ actorId, userId, credentialTypeId, teamId, expiration_date, verified_metadata });

    res.status(200).json({ message: 'Success', credential });
  } catch (error) {
    next(error);
  }
};

export const rejectCredentialCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: actorId } = req.user!;
    const { teamId, userId, credentialTypeId } = req.params as { teamId: string; userId: string; credentialTypeId: string };
    const { rejection_reason_id, review_notes } = rejectBodySchema.parse(req.body);

    const credential = await rejectCredential({ actorId, userId, credentialTypeId, teamId, rejection_reason_id, review_notes });

    res.status(200).json({ message: 'Success', credential });
  } catch (error) {
    next(error);
  }
};

export const revokeCredentialCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: actorId } = req.user!;
    const { teamId, userId, credentialTypeId } = req.params as { teamId: string; userId: string; credentialTypeId: string };
    const { reason } = revokeBodySchema.parse(req.body);

    const credential = await revokeCredential({ actorId, userId, credentialTypeId, teamId, reason });

    res.status(200).json({ message: 'Success', credential });
  } catch (error) {
    next(error);
  }
};
