import { Request, Response, NextFunction } from 'express';
import { getTeamCompliance, getOrgCompliance } from '../services/compliance.serv.js';

export const getTeamComplianceCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params as { teamId: string };
    const { orgId } = req.user!;
    const data = await getTeamCompliance(teamId, orgId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getOrgComplianceCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.user!;
    const data = await getOrgCompliance(orgId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
