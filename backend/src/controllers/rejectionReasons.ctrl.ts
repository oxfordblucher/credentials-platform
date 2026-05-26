import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { rejectionReasons } from '../db/schema/index.js';

export const getRejectionReasons = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reasons = await db
      .select({
        id: rejectionReasons.id,
        code: rejectionReasons.code,
        label: rejectionReasons.label,
      })
      .from(rejectionReasons);

    res.status(200).json({ reasons });
  } catch (error) {
    next(error);
  }
};
