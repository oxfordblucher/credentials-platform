import { Request, Response, NextFunction } from 'express';
import { fetchStaff, addMember, deleteMember } from '../services/team.serv.js';

export const getStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const staff = await fetchStaff(id);

    res.status(200).json({
      message: "Success",
      staff: staff
    });
  }
  catch (error) {
    next(error);
  }
}

export const addStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
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
    const { teamId, userId } = req.params;
    await deleteMember(teamId, userId);

    res.status(200).json({
      message: "Success"
    });
  }
  catch (error) {
    next(error);
  }
}