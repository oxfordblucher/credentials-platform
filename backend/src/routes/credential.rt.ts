import { Router } from "express";
import { submitCredential, getCredentials, addCredential, verifyCredential, revokeCredential, addTeamCred, removeTeamCred, getTeamCreds } from "../controllers/credential.ctrl.js";
import { authenticate, authorize, requireAdmin } from "../middleware/auth.js";
import { getUploadUrl } from "../controllers/uploadUrl.ctrl.js";
import { confirmUploadCtrl } from "../controllers/confirmUpload.ctrl.js";
import { verifyCredentialCtrl, rejectCredentialCtrl, revokeCredentialCtrl } from "../controllers/reviewCredential.ctrl.js";

const router = Router();

router.use(authenticate);
router.get('/', getCredentials);
router.post('/submit', submitCredential);
router.post('/:credentialTypeId/upload-url', getUploadUrl);
router.post('/:credentialTypeId/confirm-upload', confirmUploadCtrl);

router.post('/', requireAdmin, addCredential);

router.use(authorize);
router.get('/teams/:teamId', getTeamCreds);
router.post('/teams/:teamId', addTeamCred);
router.delete('/teams/:teamId/creds/:credId', removeTeamCred);
router.get('/teams/:teamId/users/:userId', getCredentials);
router.patch('/teams/:teamId/users/:userId/creds/:credId', verifyCredential);
router.delete('/teams/:teamId/users/:userId/creds/:credId', revokeCredential);

// Review endpoints (with audit logging)
router.patch('/teams/:teamId/users/:userId/credentials/:credentialTypeId/verify', verifyCredentialCtrl);
router.patch('/teams/:teamId/users/:userId/credentials/:credentialTypeId/reject', rejectCredentialCtrl);
router.delete('/teams/:teamId/users/:userId/credentials/:credentialTypeId/revoke', revokeCredentialCtrl);

export default router;