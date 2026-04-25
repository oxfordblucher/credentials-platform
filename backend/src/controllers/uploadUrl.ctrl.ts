import { Request, Response, NextFunction } from 'express';
import { uploadUrlBodySchema } from '../utils/zod.js';
import { generateUploadUrl } from '../services/uploadUrl.serv.js';

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
