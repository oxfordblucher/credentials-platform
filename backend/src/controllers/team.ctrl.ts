import { Request, Response, NextFunction } from 'express';
import { fetchTeamMembers, addMember, deleteMember } from '../services/team.serv.js';

export const getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, orgId, orgRole } = req.user!;
    const members = await fetchTeamMembers(id, orgId, orgRole);

    res.status(200).json({
      message: "Success",
      members: members
    });
  }
  catch (error) {
    next(error);
  }
}

export const addStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string;
    const { userId } = req.body;
    await addMember(teamId, userId);

    res.status(200).json({
      message: "Success"
    });
  }
  catch (error) {
    next(error);
  }
}

export const removeStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string;
    const userId = req.params.userId as string;
    await deleteMember(teamId, userId);

    res.status(200).json({
      message: "Success"
    });
  }
  catch (error) {
    next(error);
  }
}