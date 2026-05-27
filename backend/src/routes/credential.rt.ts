import { Router } from "express";
import { getCredentials } from "../controllers/credential.ctrl.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { getUploadUrl, confirmUploadCtrl } from "../controllers/uploads.ctrl.js";

const router = Router();

router.use(authenticate);
router.get('/', getCredentials);
router.post('/:credentialTypeId/upload-url', getUploadUrl);
router.post('/:credentialTypeId/confirm-upload', confirmUploadCtrl);

export default router;
