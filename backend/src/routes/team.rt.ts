import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getTeamMembers, addStaff, removeStaff } from '../controllers/team.ctrl.js';
import { sendInvites } from '../controllers/invite.ctrl.js';
import { getTeamRequirementsCtrl, addTeamRequirementCtrl, removeTeamRequirementCtrl, getCredentials } from '../controllers/credential.ctrl.js';
import { verifyCredentialCtrl, rejectCredentialCtrl, revokeCredentialCtrl, getTeamSubmissionsCtrl, getSubmissionDocumentUrlCtrl } from '../controllers/reviewCredential.ctrl.js';
import { getTeamComplianceCtrl } from '../controllers/compliance.ctrl.js';

const router = Router();
router.use(authenticate);

router.get('/', getTeamMembers);

router.use(authorize);

router.post('/:teamId/members', addStaff);
router.delete('/:teamId/members/:userId', removeStaff);

router.post('/:teamId/invite', sendInvites);

router.get('/:teamId/requirements', getTeamRequirementsCtrl);
router.post('/:teamId/requirements', addTeamRequirementCtrl);
router.delete('/:teamId/requirements/:credentialTypeId', removeTeamRequirementCtrl);
router.get('/:teamId/users/:userId', getCredentials);

router.get('/:teamId/submissions', getTeamSubmissionsCtrl);
router.get('/:teamId/submissions/:userId/:credentialTypeId/document', getSubmissionDocumentUrlCtrl);
router.get('/:teamId/compliance', getTeamComplianceCtrl);

// Review endpoints (with audit logging)
router.patch('/:teamId/users/:userId/credentials/:credentialTypeId/verify', verifyCredentialCtrl);
router.patch('/:teamId/users/:userId/credentials/:credentialTypeId/reject', rejectCredentialCtrl);
router.delete('/:teamId/users/:userId/credentials/:credentialTypeId', revokeCredentialCtrl);

export default router;