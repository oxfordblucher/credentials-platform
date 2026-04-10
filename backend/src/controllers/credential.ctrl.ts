import { Request, Response, NextFunction } from 'express';
import { readCredentials, createUserCreds, updateVerifyCreds, deleteCredentials, readTeamCreds, createTeamCred, deleteTeamCred } from '../services/credential.serv.js';
import { userCredSchema, newCredSchema } from '../utils/zod.js';

export const getCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.userId ?? req.user!.id;
    const credentials = await readCredentials(id);

    res.status(200).json({
      message: "Success",
      credentials: credentials
    });
  }
  catch (error) {
    next(error);
  }
}

export const submitCredential = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const credInput = userCredSchema.parse(req.body);
    const newCred = await createUserCreds({
      ...credInput,
      user_id: id
    });

    res.status(200).json({
      message: "Success",
      newCred: newCred
    });
  }
  catch (error) {
    next(error);
  }
}

export const verifyCredential = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const { userId, credId } = req.params;
    const verified = await updateVerifyCreds({ mgrId: id, userId, credId });

    res.status(200).json({
      message: "Success",
      verified: verified
    });
  }
  catch (error) {
    next(error);
  }
}

export const revokeCredential = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const { credId, userId } = req.params;
    const revoked = await deleteCredentials({ mgrId: id, userId, credId });

    res.status(200).json({
      message: "Success",
      revoked: revoked
    });
  }
  catch (error) {
    next(error);
  }
}

export const getTeamCreds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
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
    const { teamId } = req.params;
    const { credId } = req.body;
    const credential = await createTeamCred(teamId, credId);
    res.status(200).json({
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
    const { teamId } = req.params;
    const { credId } = req.body;
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

export const addCredential = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.user!;
    const verified = newCredSchema.parse(req.body);
    const newCred = await createCredential();
  }
  catch (error) {
    next(error);
  }
}