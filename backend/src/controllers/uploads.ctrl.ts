import { Request, Response, NextFunction } from 'express';
import { uploadUrlBodySchema, confirmUploadBodySchema } from '../utils/zod.js';
import { generateUploadUrl, confirmUpload } from '../services/uploads.serv.js';

export const getUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId, orgId } = req.user!;
    const { credentialTypeId } = req.params as { credentialTypeId: string };
    const { ext } = uploadUrlBodySchema.parse(req.body);

    const result = await generateUploadUrl({ orgId, userId, credentialTypeId, ext });

    res.status(200).json({
      message: 'Success',
      presigned_url: result.presigned_url,
      object_key: result.object_key,
    });
  } catch (error) {
    next(error);
  }
};

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
