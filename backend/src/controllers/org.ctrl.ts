import { Request, Response, NextFunction } from 'express';
import { setupSchema } from '../utils/zod.js';
import { createOrg, fetchTeams } from '../services/org.serv.js';

export const setupOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = setupSchema.parse(req.body);
    await createOrg(validated);

    res.status(201).json({
      message: 'Organization registered successfully'
    });
  }
  catch (error) {
    next(error);
  }
}

export const getTeams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { org } = req.user!;
    const teams = await fetchTeams(org);

    res.status(200).json({
      message: "Teams fetched successfully",
      teams: teams
    });
  }
  catch (error) {
    next(error);
  }
}

export const createTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
  }
  catch (error) {
    next(error);
  }
}

export const removeTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {

  }
  catch (error) {
    next(error);
  }
}