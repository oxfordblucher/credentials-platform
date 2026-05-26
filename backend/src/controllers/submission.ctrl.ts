import { Request, Response, NextFunction } from 'express';
import { getTeamSubmissions, getSubmissionDocumentUrl } from '../services/submission.serv.js';

export const getTeamSubmissionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params as { teamId: string };
    const { orgId } = req.user!;
    const submissions = await getTeamSubmissions(teamId, orgId);
    res.status(200).json({ submissions });
  } catch (error) {
    next(error);
  }
};

export const getSubmissionDocumentUrlCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: actorId, orgId } = req.user!;
    const { teamId, userId, credentialTypeId } = req.params as { teamId: string; userId: string; credentialTypeId: string };
    const view_url = await getSubmissionDocumentUrl(teamId, userId, credentialTypeId, actorId, orgId);
    res.status(200).json({ view_url, expires_in: 3600 });
  } catch (error) {
    next(error);
  }
};
