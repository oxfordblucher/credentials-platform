import { Router } from "express";
import { getCredentials, addCredential, verifyCredential } from "../controllers/credential.ctrl.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get('/', getCredentials);
router.post('/', addCredential);

router.use(authorize);

router.get('/:userId', getCredentials);
router.put('/:userId/:credId', verifyCredential);

export default router;