import { Router } from 'express';
import { authenticate, authorize, requireAdmin, requireOwner } from '../middleware/auth.js';
import { getTeams, makeTeam, removeTeam, setupOrg, promoteOwnerCtrl, addCredentialType, getCredentialTypes, editCredentialType, removeCredentialType } from '../controllers/org.ctrl.js';
import { getOrgComplianceCtrl } from '../controllers/compliance.ctrl.js';

const router = Router();

router.post('/', setupOrg);

router.use(authenticate);

router.get('/', getTeams);
router.get('/compliance', requireAdmin, getOrgComplianceCtrl);

router.patch('/owner', requireOwner, promoteOwnerCtrl);

router.post('/credential-types', requireAdmin, addCredentialType);
router.get('/credential-types', requireAdmin, getCredentialTypes);
router.patch('/credential-types/:typeId', requireAdmin, editCredentialType);
router.delete('/credential-types/:typeId', requireAdmin, removeCredentialType);

router.use(authorize);

router.post('/teams', makeTeam);
router.delete('/teams/:teamId', removeTeam);

export default router;