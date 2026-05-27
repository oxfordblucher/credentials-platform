import { Request, Response, NextFunction } from 'express';
import { newTeamSchema, setupSchema, createCredTypeSchema, updateCredTypeSchema, listCredTypeQuerySchema } from '../utils/zod.js';
import { createOrg, fetchTeams, createTeam, deleteTeam } from '../services/org.serv.js';
import { promoteToOwner } from '../services/user.serv.js';
import {
  createCredentialType,
  listCredentialTypes,
  updateCredentialType,
  deactivateCredentialType
} from '../services/credentialType.serv.js';
import { db } from '../db/index.js';
import { rejectionReasons } from '../db/schema/index.js';

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
    const { orgId } = req.user!;
    const teams = await fetchTeams(orgId);

    res.status(200).json({
      message: "Teams fetched successfully",
      teams: teams
    });
  }
  catch (error) {
    next(error);
  }
}

export const makeTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.user!;
    const validated = newTeamSchema.parse(req.body);
    const team = await createTeam({
      org_id: orgId,
      name: validated.name,
      description: validated.description
    });

    res.status(200).json({
      message: "Team created successfully",
      team: team
    });
  }
  catch (error) {
    next(error);
  }
}

export const removeTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string;
    const deletedTeam = await deleteTeam(teamId);

    res.status(200).json({
      message: "Success",
      deleted: deletedTeam
    });
  }
  catch (error) {
    next(error);
  }
}

export const promoteOwnerCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: actorId, orgId } = req.user!;
    const { userId: targetUserId } = req.body as { userId: string };
    await promoteToOwner(actorId, targetUserId, orgId);

    res.status(200).json({ message: 'Ownership transferred' });
  }
  catch (error) {
    next(error);
  }
}

export const addCredentialType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.user!;
    const input = createCredTypeSchema.parse(req.body);
    const credType = await createCredentialType(orgId, input);
    res.status(201).json({ message: 'Created', credentialType: credType });
  } catch (error) {
    next(error);
  }
};

export const getCredentialTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.user!;
    const { includeDeactivated } = listCredTypeQuerySchema.parse(req.query);
    const credTypes = await listCredentialTypes(orgId, includeDeactivated ?? false);
    res.status(200).json({ message: 'Success', credentialTypes: credTypes });
  } catch (error) {
    next(error);
  }
};

export const editCredentialType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.user!;
    const { typeId } = req.params as { typeId: string };
    const input = updateCredTypeSchema.parse(req.body);
    const updated = await updateCredentialType(typeId, orgId, input);
    res.status(200).json({ message: 'Success', credentialType: updated });
  } catch (error) {
    next(error);
  }
};

export const removeCredentialType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.user!;
    const { typeId } = req.params as { typeId: string };
    const deactivated = await deactivateCredentialType(typeId, orgId);
    res.status(200).json({ message: 'Success', deactivated });
  } catch (error) {
    next(error);
  }
};

export const getRejectionReasons = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reasons = await db
      .select({
        id: rejectionReasons.id,
        code: rejectionReasons.code,
        label: rejectionReasons.label,
      })
      .from(rejectionReasons);

    res.status(200).json({ reasons });
  } catch (error) {
    next(error);
  }
};