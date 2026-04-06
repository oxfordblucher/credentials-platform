import { Request, Response, NextFunction } from 'express';
import { fetchUserCreds, addUserCred, confirmUserCred, removeUserCred } from '../services/credential.serv.js';

export const getCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id ?? req.user!.id;
    const credentials = await fetchUserCreds(id);

    res.status(200).json({
      message: "Success",
      credentials: credentials
    });
  }
  catch (error) {
    next(error);
  }
}

export const addCredential = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const credInput = req.body;
    const newCred = await addUserCred(id, credInput);

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
    const verified = await confirmUserCred(id, userId, credId);

    res.status(200).json({
      message: "Success",
      verified: verified
    });
  }
  catch (error) {
    next(error);
  }
}