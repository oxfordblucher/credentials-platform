import { Request, Response, NextFunction } from 'express';
import { inviteSchema } from '../utils/zod.js';
import { createInvites, fetchInvites, updateInvite, deleteInvite } from '../services/invite.serv.js';

export const sendInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const validated = inviteSchema.parse(req.body);
    const newInvites = await createInvites(validated, id);

    res.status(201).json({
      message: "Invites sent successfully",
      invites: newInvites
    });
  }
  catch (error) {
    next(error);
  }
}

export const getInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const invites = await fetchInvites(id);

    res.status(200).json({
      message: 'Invites fetched successfully',
      invites: invites
    })
  }
  catch (error) {
    next(error);
  }
}

export const renewInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const newExpiration = await updateInvite(id);

    res.status(200).json({
      message: 'Invite renewed successfully',
      date: newExpiration
    });
  }
  catch (error) {
    next(error);
  }
}

export const revokeInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    await deleteInvite(id);

    res.status(200).json({
      message: "Invite deleted successfully"
    })
  }
  catch (error) {
    next(error);
  }
}