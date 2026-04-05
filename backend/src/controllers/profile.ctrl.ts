import { Request, Response, NextFunction } from 'express';
import { editProfile, fetchProfile } from '../services/user.serv.js';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id ?? req.user!.id;
    const profile = await fetchProfile(id);
    
    res.status(200).json({
      profile: profile
    });
  }
  catch (error) {
    next(error);
  }
}

export const updateEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const { field, input } = req.body;
    await editProfile(id, field, input);
    res.status(200).json({
      message: "Edit completed successfully"
    });
  }
  catch (error) {
    next(error);
  }
}

export const updateName = async (req: Request, res: Response, next: NextFunction) => {
  try {

  }
  catch (error) {
    next(error);
  }
}

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {

  }
  catch (error) {
    next(error);
  }
}

export const deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {

  }
  catch (error) {
    next(error);
  }
}