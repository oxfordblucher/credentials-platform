import { Router } from "express";
import { getCredentials, addCredential, verifyCredential } from "../controllers/credential.js";

const router = Router();

router.get('/', getCredentials);
router.post('/', addCredential);
router.put('/:user/:cred', verifyCredential);

export default router;