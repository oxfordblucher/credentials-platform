import { Router } from "express";
import { getCredentials, addCredential, verifyCredential } from "../controllers/credential.ctrl.js";

const router = Router();

router.get('/', getCredentials);
router.post('/', addCredential);
router.put('/:user/:cred', verifyCredential);

export default router;