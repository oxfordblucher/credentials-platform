import { Request, Response, NextFunction } from 'express';
import {
  createCredTypeSchema,
  updateCredTypeSchema,
  listCredTypeQuerySchema
} from '../utils/zod.js';
import {
  createCredentialType,
  listCredentialTypes,
  updateCredentialType,
  deactivateCredentialType
} from '../services/credentialType.serv.js';

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
