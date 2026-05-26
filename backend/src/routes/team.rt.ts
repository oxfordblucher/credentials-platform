import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getStaff, addStaff, removeStaff } from '../controllers/team.ctrl.js';
import { sendInvites } from '../controllers/invite.ctrl.js';
import { getTeamCreds, addTeamCred, removeTeamCred, getCredentials } from '../controllers/credential.ctrl.js';
import { verifyCredentialCtrl, rejectCredentialCtrl, revokeCredentialCtrl } from '../controllers/reviewCredential.ctrl.js';
import { getTeamSubmissionsCtrl, getSubmissionDocumentUrlCtrl } from '../controllers/submission.ctrl.js';
import { getTeamComplianceCtrl } from '../controllers/compliance.ctrl.js';

const router = Router();
router.use(authenticate);

router.get('/', getStaff);

router.use(authorize);

router.post('/:teamId/members', addStaff);
router.delete('/:teamId/members/:userId', removeStaff);

router.post('/:teamId/invite', sendInvites);

router.get('/:teamId', getTeamCreds);
router.post('/:teamId', addTeamCred);
router.delete('/:teamId/creds/:credId', removeTeamCred);
router.get('/:teamId/users/:userId', getCredentials);

router.get('/:teamId/submissions', getTeamSubmissionsCtrl);
router.get('/:teamId/submissions/:userId/:credentialTypeId/document', getSubmissionDocumentUrlCtrl);
router.get('/:teamId/compliance', getTeamComplianceCtrl);

// Review endpoints (with audit logging)
router.patch('/:teamId/users/:userId/credentials/:credentialTypeId/verify', verifyCredentialCtrl);
router.patch('/:teamId/users/:userId/credentials/:credentialTypeId/reject', rejectCredentialCtrl);
router.delete('/:teamId/users/:userId/credentials/:credentialTypeId/revoke', revokeCredentialCtrl);

export default router;