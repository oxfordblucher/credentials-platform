import { Request, Response, NextFunction } from 'express';
import { confirmUploadBodySchema } from '../utils/zod.js';
import { confirmUpload } from '../services/confirmUpload.serv.js';

export const confirmUploadCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, orgId } = req.user!;
    const { credentialTypeId } = req.params as { credentialTypeId: string };
    const { submitted_metadata } = confirmUploadBodySchema.parse(req.body);

    const credential = await confirmUpload({ userId, orgId, credentialTypeId, submittedMetadata: submitted_metadata });

    res.status(200).json({ message: 'Success', credential });
  } catch (error) {
    next(error);
  }
};
