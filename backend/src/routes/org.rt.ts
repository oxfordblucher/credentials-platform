import { Router } from 'express';
import { authenticate, authorize, requireAdmin } from '../middleware/auth.js';
import { getTeams, makeTeam, removeTeam, setupOrg } from '../controllers/org.ctrl.js';
import {
  addCredentialType,
  getCredentialTypes,
  editCredentialType,
  removeCredentialType
} from '../controllers/credentialType.ctrl.js';

const router = Router();

router.post('/', setupOrg);

router.use(authenticate);

router.get('/', getTeams);

router.post('/credential-types', requireAdmin, addCredentialType);
router.get('/credential-types', requireAdmin, getCredentialTypes);
router.patch('/credential-types/:typeId', requireAdmin, editCredentialType);
router.delete('/credential-types/:typeId', requireAdmin, removeCredentialType);

router.use(authorize);

router.post('/teams', makeTeam);
router.delete('/teams/:teamId', removeTeam);

export default router;