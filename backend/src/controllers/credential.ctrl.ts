import { Request, Response, NextFunction } from 'express';
import { readCredentials, readTeamCreds, createTeamCred, deleteTeamCred } from '../services/credential.serv.js';

export const getCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paramUserId = req.params.userId as string | undefined;
    const { id: selfId, orgId } = req.user!;
    const id = paramUserId ?? selfId;
    const credentials = await readCredentials(id, paramUserId !== undefined ? orgId : undefined);

    res.status(200).json({
      message: "Success",
      credentials: credentials
    });
  }
  catch (error) {
    next(error);
  }
}

export const getTeamCreds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params as { teamId: string };
    const credentials = await readTeamCreds(teamId);

    res.status(200).json({
      message: "Success",
      credentials: credentials
    });
  }
  catch (error) {
    next(error);
  }
}

export const addTeamCred = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params as { teamId: string };
    const { credId } = req.body;
    const credential = await createTeamCred(teamId, credId);

    res.status(201).json({
      message: "Success",
      credential: credential
    });
  }
  catch (error) {
    next(error);
  }
}

export const removeTeamCred = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId, credId } = req.params as { teamId: string; credId: string; };
    const deleted = await deleteTeamCred(teamId, credId);

    res.status(200).json({
      message: "Success",
      deleted: deleted
    });
  }
  catch (error) {
    next(error);
  }
}

